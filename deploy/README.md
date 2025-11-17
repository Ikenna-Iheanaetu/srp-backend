# Deployment Scripts

## Setup

1. **Copy the environment template:**
   ```bash
   cd deploy
   cp .env.deploy.example .env.deploy.staging
   ```

2. **Edit the configuration** (if needed):
   ```bash
   nano .env.deploy.staging
   ```

3. **Make the script executable:**
   ```bash
   chmod +x deploy.sh
   chmod +x deploy-staging.sh
   ```

## Usage

### Option 1: Using the flexible script (Recommended)
```bash
./deploy.sh staging
```

This uses the `.env.deploy.staging` file for configuration.

### Option 2: Using the standalone script
```bash
./deploy-staging.sh
```

This has all values hardcoded in the script.

## Adding Production Environment

1. Create a production config:
   ```bash
   cp .env.deploy.example .env.deploy.production
   ```

2. Edit with production values:
   ```bash
   nano .env.deploy.production
   ```

3. Deploy to production:
   ```bash
   ./deploy.sh production
   ```

## Security Best Practices

### Safe to Commit to GitHub:
✅ AWS Account ID (605134471588) - This is public info
✅ AWS Region (eu-west-1) - This is not sensitive
✅ ECR Repository names - These are not sensitive
✅ ECS Cluster/Service names - These are not sensitive

### DO NOT Commit:
❌ AWS Access Keys
❌ AWS Secret Keys
❌ Application secrets/passwords
❌ Database credentials

### What to Add to .gitignore:
```
# Deployment configs (add these to your .gitignore)
.env.deploy.*
!.env.deploy.example
```

## Monitoring Deployment

After running the script, monitor your deployment at:
- **ECS Console:** https://console.aws.amazon.com/ecs/
- **CloudWatch Logs:** Check for any errors during startup
- **Target Group Health:** Verify health checks pass

## Troubleshooting

### If build fails:
- Check Docker is running
- Ensure you're in the monorepo root directory
- Verify `apps/api/Dockerfile` exists

### If ECR push fails:
- Check AWS credentials are configured: `aws sts get-caller-identity`
- Verify ECR repository exists
- Check network connection

### If ECS deployment fails:
- Check ECS service name is correct
- Verify you have permissions to update the service
- Check CloudWatch logs for application errors

## Pre-requisites

- Docker installed and running
- AWS CLI installed and configured
- Git installed
- Proper AWS IAM permissions for ECR and ECS
