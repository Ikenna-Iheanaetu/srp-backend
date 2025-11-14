#!/usr/bin/env bash

# deploy_web_ecs.sh
# Automates the entire build, push, and ECS deployment process for the 'web' application.

# --- Utility Functions ---

# Check for required tools
command -v docker >/dev/null 2>&1 || { echo >&2 "Error: Docker is required but not installed."; exit 1; }
command -v aws >/dev/null 2>&1 || { echo >&2 "Error: AWS CLI is required but not installed."; exit 1; }
command -v jq >/dev/null 2>&1 || { echo >&2 "Error: 'jq' (JSON processor) is required but not installed. Install with 'sudo apt-get install jq'."; exit 1; }
command -v git >/dev/null 2>&1 || { echo >&2 "Error: Git is required."; exit 1; }

# Function to load environment variables from the .env file
load_env_vars() {
    local env_file="apps/web/.env"
    if [ ! -f "$env_file" ]; then
        echo "Error: .env file not found at $env_file"
        exit 1
    fi
    echo "Loading configuration variables from $env_file..."
    
    # Read the required variables and export them
    export VITE_API_URL=$(grep -E '^VITE_API_URL=' "$env_file" | cut -d '=' -f 2- | tr -d '"')
    export VITE_GOOGLE_CLIENT_ID=$(grep -E '^VITE_GOOGLE_CLIENT_ID=' "$env_file" | cut -d '=' -f 2- | tr -d '"')
    export VITE_SITE_URL=$(grep -E '^VITE_SITE_URL=' "$env_file" | cut -d '=' -f 2- | tr -d '"')

    export AWS_REGION=$(grep -E '^AWS_REGION=' "$env_file" | cut -d '=' -f 2- | tr -d '"')
    export AWS_ACCOUNT_ID=$(grep -E '^AWS_ACCOUNT_ID=' "$env_file" | cut -d '=' -f 2- | tr -d '"')
    export ECR_REPOSITORY=$(grep -E '^ECR_REPOSITORY=' "$env_file" | cut -d '=' -f 2- | tr -d '"')
    export ECS_CLUSTER=$(grep -E '^ECS_CLUSTER=' "$env_file" | cut -d '=' -f 2- | tr -d '"')
    export ECS_SERVICE=$(grep -E '^ECS_SERVICE=' "$env_file" | cut -d '=' -f 2- | tr -d '"')
    export ECS_TASK_DEFINITION=$(grep -E '^ECS_TASK_DEFINITION=' "$env_file" | cut -d '=' -f 2- | tr -d '"')
    export CONTAINER_NAME=$(grep -E '^CONTAINER_NAME=' "$env_file" | cut -d '=' -f 2- | tr -d '"')

    # Derive ECR_REGISTRY after sourcing region and account ID
    export ECR_REGISTRY="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
    
    if [ -z "$VITE_API_URL" ] || [ -z "$AWS_REGION" ] || [ -z "$AWS_ACCOUNT_ID" ]; then
        echo "Error: Required configuration variables not found or empty in $env_file."
        exit 1
    fi
}

# --- Deployment Logic ---

load_env_vars # Run the function to load all variables

# Get a unique tag based on the current Git SHA
export IMAGE_TAG=$(git rev-parse --short HEAD)
export FULL_IMAGE_URI="${ECR_REGISTRY}/${ECR_REPOSITORY}:${IMAGE_TAG}"
export LATEST_IMAGE_URI="${ECR_REGISTRY}/${ECR_REPOSITORY}:latest"

echo "--- Starting Web App Deployment ---"
echo "Target Cluster: ${ECS_CLUSTER}"
echo "New Image Tag: ${IMAGE_TAG}"
echo "Full Image URI: ${FULL_IMAGE_URI}"
echo "-----------------------------------"


# 1. Login to Amazon ECR
echo "1. Logging into Amazon ECR..."
if ! aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ECR_REGISTRY; then
    echo "ECR Login failed. Check AWS credentials and permissions."
    exit 1
fi
echo "ECR Login successful."

# 1.5 Build Monorepo Dependencies
# This must run BEFORE Docker build to ensure the 'dist' folder exists
echo "1.5 Building monorepo dependencies (packages/shared)..."
if ! pnpm --filter '@repo/shared' build; then
    echo "Shared package build failed. Aborting deployment."
    exit 1
fi
echo "Shared package build successful."

# 2. Build Docker Image with Retries
echo "2. Building Docker image with tag: srs-team/web:local-test"
MAX_RETRIES=3
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if docker build \
        --file apps/web/Dockerfile \
        --build-arg VITE_API_URL="$VITE_API_URL" \
        --build-arg VITE_GOOGLE_CLIENT_ID="$VITE_GOOGLE_CLIENT_ID" \
        --build-arg VITE_SITE_URL="$VITE_SITE_URL" \
        --tag srs-team/web:local-test \
        .; then
        echo "Docker build successful on attempt $((RETRY_COUNT + 1))."
        break
    else
        RETRY_COUNT=$((RETRY_COUNT + 1))
        if [ $RETRY_COUNT -lt $MAX_RETRIES ]; then
            echo "Docker build failed (Attempt ${RETRY_COUNT}/${MAX_RETRIES}). Retrying in 5 seconds..."
            sleep 5
        else
            echo "Docker build failed after ${MAX_RETRIES} attempts. Giving up."
            exit 1
        fi
    fi
done

# 3. Tag and Push to ECR
echo "3. Tagging and pushing images to ECR..."
docker tag srs-team/web:local-test $FULL_IMAGE_URI
docker tag srs-team/web:local-test $LATEST_IMAGE_URI

if ! docker push $FULL_IMAGE_URI; then
    echo "Docker push of SHA tag failed."
    exit 1
fi
if ! docker push $LATEST_IMAGE_URI; then
    echo "Docker push of 'latest' tag failed."
    exit 1
fi
echo "Images successfully pushed to ECR."

# 4. Download and Modify Task Definition
echo "4. Downloading and modifying Task Definition..."

# Download current Task Definition
aws ecs describe-task-definition \
    --task-definition $ECS_TASK_DEFINITION \
    --query taskDefinition \
    --output json > task-definition-base.json

# Remove unwanted fields (as per standard practice for registering new revisions)
jq 'del(.taskDefinitionArn, .revision, .status, .requiresAttributes, .compatibilities, .registeredAt, .registeredBy)' task-definition-base.json > task-definition-new.json

# Update the image URI for the specific container
jq --arg img "$FULL_IMAGE_URI" \
   --arg name "$CONTAINER_NAME" \
   '(.containerDefinitions[] | select(.name == $name).image) = $img' \
   task-definition-new.json > task-definition-final.json

# 5. Register New Task Definition Revision
echo "5. Registering new Task Definition revision..."
NEW_TASK_DEF_ARN=$(aws ecs register-task-definition \
    --cli-input-json file://task-definition-final.json \
    --query 'taskDefinition.taskDefinitionArn' \
    --output text)

if [ -z "$NEW_TASK_DEF_ARN" ]; then
    echo "Failed to register new Task Definition."
    exit 1
fi
echo "New Task Definition registered: ${NEW_TASK_DEF_ARN}"

# 5.5 Cleanup temporary files
echo "5.5 Cleaning up temporary JSON files..."
rm task-definition-base.json task-definition-new.json task-definition-final.json

# 6. Update ECS Service
echo "6. Updating ECS Service and forcing new deployment..."
aws ecs update-service \
    --cluster $ECS_CLUSTER \
    --service $ECS_SERVICE \
    --task-definition $NEW_TASK_DEF_ARN \
    --force-new-deployment > /dev/null

# 7. Wait for Service Stability
echo "7. Waiting for service stability. This may take a few minutes..."
aws ecs wait services-stable --cluster $ECS_CLUSTER --services $ECS_SERVICE

echo "-----------------------------------"
echo "✅ DEPLOYMENT COMPLETE!"
echo "Service ${ECS_SERVICE} in cluster ${ECS_CLUSTER} is stable."
echo "Running Image: ${FULL_IMAGE_URI}"

exit 0