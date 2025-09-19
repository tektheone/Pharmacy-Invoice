# AWS Deployment Guide for Pharmacy Invoice Application

## Overview
This guide explains how to deploy the pharmacy invoice validation application on AWS using Docker containers without nginx.

## Architecture
- **Frontend**: React application served by `serve` package on port 3000
- **Backend**: Node.js/Express API on port 5000
- **No Load Balancer**: Direct container deployment with individual ALBs

## Prerequisites
- AWS CLI configured
- Docker installed locally
- ECR repositories created
- ECS cluster set up

## Step 1: Create ECR Repositories

```bash
# Create repositories
aws ecr create-repository --repository-name pharmacy-frontend
aws ecr create-repository --repository-name pharmacy-backend

# Get login token
aws ecr get-login-password --region your-region | docker login --username AWS --password-stdin your-account-id.dkr.ecr.your-region.amazonaws.com
```

## Step 2: Build and Push Docker Images

### Build Images
```bash
# Build backend
docker build -t pharmacy-backend ./backend
docker tag pharmacy-backend:latest your-account-id.dkr.ecr.your-region.amazonaws.com/pharmacy-backend:latest

# Build frontend
docker build -t pharmacy-frontend ./frontend
docker tag pharmacy-frontend:latest your-account-id.dkr.ecr.your-region.amazonaws.com/pharmacy-frontend:latest
```

### Push to ECR
```bash
# Push backend
docker push your-account-id.dkr.ecr.your-region.amazonaws.com/pharmacy-backend:latest

# Push frontend
docker push your-account-id.dkr.ecr.your-region.amazonaws.com/pharmacy-frontend:latest
```

## Step 3: Create ECS Task Definitions

### Backend Task Definition
```json
{
  "family": "pharmacy-backend",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512",
  "executionRoleArn": "arn:aws:iam::your-account-id:role/ecsTaskExecutionRole",
  "taskRoleArn": "arn:aws:iam::your-account-id:role/ecsTaskRole",
  "containerDefinitions": [
    {
      "name": "pharmacy-backend",
      "image": "your-account-id.dkr.ecr.your-region.amazonaws.com/pharmacy-backend:latest",
      "portMappings": [
        {
          "containerPort": 5000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        },
        {
          "name": "PORT",
          "value": "5000"
        },
        {
          "name": "ALLOWED_ORIGINS",
          "value": "https://your-frontend-domain.com"
        }
      ],
      "healthCheck": {
        "command": ["CMD-SHELL", "curl -f http://localhost:5000/api/health || exit 1"],
        "interval": 30,
        "timeout": 5,
        "retries": 3,
        "startPeriod": 60
      },
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/pharmacy-backend",
          "awslogs-region": "your-region",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

### Frontend Task Definition
```json
{
  "family": "pharmacy-frontend",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512",
  "executionRoleArn": "arn:aws:iam::your-account-id:role/ecsTaskExecutionRole",
  "taskRoleArn": "arn:aws:iam::your-account-id:role/ecsTaskRole",
  "containerDefinitions": [
    {
      "name": "pharmacy-frontend",
      "image": "your-account-id.dkr.ecr.your-region.amazonaws.com/pharmacy-frontend:latest",
      "portMappings": [
        {
          "containerPort": 3000,
          "protocol": "tcp"
        }
      ],
      "healthCheck": {
        "command": ["CMD-SHELL", "curl -f http://localhost:3000/health || exit 1"],
        "interval": 30,
        "timeout": 5,
        "retries": 3,
        "startPeriod": 60
      },
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/pharmacy-frontend",
          "awslogs-region": "your-region",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

## Step 4: Create ECS Services

### Backend Service
```bash
aws ecs create-service \
  --cluster your-cluster-name \
  --service-name pharmacy-backend-service \
  --task-definition pharmacy-backend:1 \
  --desired-count 2 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx,subnet-yyy],securityGroups=[sg-xxx],assignPublicIp=ENABLED}" \
  --load-balancer targetGroupArn=arn:aws:elasticloadbalancing:your-region:your-account-id:targetgroup/pharmacy-backend-tg/xxx,containerName=pharmacy-backend,containerPort=5000
```

### Frontend Service
```bash
aws ecs create-service \
  --cluster your-cluster-name \
  --service-name pharmacy-frontend-service \
  --task-definition pharmacy-frontend:1 \
  --desired-count 2 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx,subnet-yyy],securityGroups=[sg-xxx],assignPublicIp=ENABLED}" \
  --load-balancer targetGroupArn=arn:aws:elasticloadbalancing:your-region:your-account-id:targetgroup/pharmacy-frontend-tg/xxx,containerName=pharmacy-frontend,containerPort=3000
```

## Step 5: Configure Load Balancers

### Application Load Balancer (ALB)
- Create separate target groups for frontend (port 3000) and backend (port 5000)
- Configure health checks:
  - Backend: `/api/health`
  - Frontend: `/` (root path)

### Security Groups
- Frontend ALB: Allow HTTP/HTTPS from internet
- Backend ALB: Allow traffic only from frontend ALB
- ECS tasks: Allow traffic from respective ALB security groups

## Step 6: Environment Variables

### Backend Environment Variables
```bash
NODE_ENV=production
PORT=5000
ALLOWED_ORIGINS=https://your-frontend-domain.com
```

### Frontend Environment Variables
```bash
# Frontend is served by nginx, no environment variables needed
# Build-time environment variables should be configured in the Docker build process
```

## Step 7: Monitoring and Logging

### CloudWatch Logs
- Create log groups: `/ecs/pharmacy-frontend` and `/ecs/pharmacy-backend`
- Configure log retention policies

### Health Checks
- Backend: `/api/health` endpoint
- Frontend: `/health` endpoint
- Set appropriate intervals and retries

## Step 8: Scaling Configuration

### Auto Scaling
```bash
aws application-autoscaling register-scalable-target \
  --service-namespace ecs \
  --scalable-dimension ecs:service:DesiredCount \
  --resource-id service/your-cluster-name/pharmacy-backend-service \
  --min-capacity 2 \
  --max-capacity 10
```

## Troubleshooting

### Common Issues
1. **CORS Errors**: Verify `ALLOWED_ORIGINS` environment variable
2. **Health Check Failures**: Check if health endpoints are accessible
3. **Container Startup Issues**: Review CloudWatch logs
4. **Port Conflicts**: Ensure correct port mappings

### Useful Commands
```bash
# Check service status
aws ecs describe-services --cluster your-cluster --services pharmacy-backend-service pharmacy-frontend-service

# View logs
aws logs tail /ecs/pharmacy-backend --follow
aws logs tail /ecs/pharmacy-frontend --follow

# Update service
aws ecs update-service --cluster your-cluster --service pharmacy-backend-service --task-definition pharmacy-backend:2
```

## Security Considerations

1. **VPC Configuration**: Use private subnets for ECS tasks
2. **Security Groups**: Restrict traffic between services
3. **IAM Roles**: Use least privilege principle
4. **HTTPS**: Enable SSL/TLS for all external traffic
5. **Secrets Management**: Use AWS Secrets Manager for sensitive data

## Cost Optimization

1. **Reserved Instances**: Consider reserved capacity for predictable workloads
2. **Spot Instances**: Use spot instances for non-critical workloads
3. **Auto Scaling**: Implement proper scaling policies
4. **Resource Limits**: Set appropriate CPU and memory limits
