#!/bin/bash

# Sports Recruitment Platform - Flexible Deploy Script
# Usage: ./deploy.sh [environment]
# Example: ./deploy.sh staging

set -e  # Exit on any error

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Get environment from argument (default to staging)
ENVIRONMENT=${1:-staging}
ENV_FILE="${SCRIPT_DIR}/.env.deploy.${ENVIRONMENT}"

# Check if env file exists
if [ ! -f "${ENV_FILE}" ]; then
  echo -e "${RED}Error: Environment file '${ENV_FILE}' not found!${NC}"
  echo -e "Create it from the example: cp ${SCRIPT_DIR}/.env.deploy.example ${ENV_FILE}"
  exit 1
fi

# Load environment variables
echo -e "${GREEN}Loading configuration from ${ENV_FILE}...${NC}"
set -a  # automatically export all variables
source "${ENV_FILE}"
set +a  # stop automatically exporting

# Derived variables
ECR_REGISTRY="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
ECR_IMAGE="${ECR_REGISTRY}/${ECR_REPOSITORY}"
GIT_SHA=$(git rev-parse --short HEAD)
BUILD_TIME=$(date -u +'%Y-%m-%dT%H:%M:%SZ')

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Deploying ${ENVIRONMENT^^} API${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "Repository: ${ECR_REPOSITORY}"
echo -e "Git SHA: ${GIT_SHA}"
echo -e "Build Time: ${BUILD_TIME}"
echo ""

# Step 1: Login to ECR
echo -e "${YELLOW}[1/5] Logging into AWS ECR...${NC}"
aws ecr get-login-password --region "${AWS_REGION}" | \
  docker login --username AWS --password-stdin "${ECR_REGISTRY}"

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✓ Successfully logged into ECR${NC}"
else
  echo -e "${RED}✗ Failed to login to ECR${NC}"
  exit 1
fi

# Step 2: Build Docker image
echo -e "\n${YELLOW}[2/5] Building Docker image...${NC}"
docker build \
  -f "${DOCKERFILE_PATH}" \
  --build-arg GIT_SHA="${GIT_SHA}" \
  --build-arg BUILD_TIME="${BUILD_TIME}" \
  -t "${ECR_REPOSITORY}:${IMAGE_TAG}" \
  .

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✓ Successfully built Docker image${NC}"
else
  echo -e "${RED}✗ Failed to build Docker image${NC}"
  exit 1
fi

# Step 3: Tag image for ECR
echo -e "\n${YELLOW}[3/5] Tagging image for ECR...${NC}"
docker tag "${ECR_REPOSITORY}:${IMAGE_TAG}" "${ECR_IMAGE}:${IMAGE_TAG}"
docker tag "${ECR_REPOSITORY}:${IMAGE_TAG}" "${ECR_IMAGE}:${GIT_SHA}"

echo -e "${GREEN}✓ Tagged image with 'latest' and '${GIT_SHA}'${NC}"

# Step 4: Push to ECR
echo -e "\n${YELLOW}[4/5] Pushing image to ECR...${NC}"
docker push "${ECR_IMAGE}:${IMAGE_TAG}"
docker push "${ECR_IMAGE}:${GIT_SHA}"

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✓ Successfully pushed images to ECR${NC}"
else
  echo -e "${RED}✗ Failed to push images to ECR${NC}"
  exit 1
fi

# Step 5: Deploy to ECS
echo -e "\n${YELLOW}[5/5] Deploying to ECS...${NC}"
aws ecs update-service \
  --cluster "${ECS_CLUSTER}" \
  --service "${ECS_SERVICE}" \
  --force-new-deployment \
  --region "${AWS_REGION}" \
  > /dev/null

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✓ Successfully triggered ECS deployment${NC}"
else
  echo -e "${RED}✗ Failed to trigger ECS deployment${NC}"
  exit 1
fi

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Deployment Complete! 🚀${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "Image pushed:"
echo -e "  ${ECR_IMAGE}:${IMAGE_TAG}"
echo -e "  ${ECR_IMAGE}:${GIT_SHA}"
echo ""
echo -e "Monitor deployment:"
echo -e "  https://console.aws.amazon.com/ecs/v2/clusters/${ECS_CLUSTER}/services/${ECS_SERVICE}/health"
echo ""