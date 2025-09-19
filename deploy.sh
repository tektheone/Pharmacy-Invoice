#!/bin/bash

# AWS Deployment Script for Pharmacy Invoice Application
# Make sure you have AWS CLI configured and Docker running

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
AWS_REGION=${AWS_REGION:-us-east-1}
CLUSTER_NAME="pharmacy-cluster"
FRONTEND_SERVICE="pharmacy-frontend-service"
BACKEND_SERVICE="pharmacy-backend-service"

echo -e "${GREEN}🚀 Starting AWS Deployment for Pharmacy Invoice Application${NC}"
echo "Region: $AWS_REGION"

# Get AWS account ID
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
echo "AWS Account ID: $AWS_ACCOUNT_ID"

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
echo -e "\n${YELLOW}Checking prerequisites...${NC}"
if ! command_exists aws; then
    echo -e "${RED}❌ AWS CLI is not installed. Please install it first.${NC}"
    exit 1
fi

if ! command_exists docker; then
    echo -e "${RED}❌ Docker is not installed. Please install it first.${NC}"
    exit 1
fi

# Check AWS credentials
if ! aws sts get-caller-identity >/dev/null 2>&1; then
    echo -e "${RED}❌ AWS credentials not configured. Please run 'aws configure' first.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Prerequisites check passed${NC}"

# Step 1: Create ECR Repositories
echo -e "\n${YELLOW}Step 1: Creating ECR repositories...${NC}"
aws ecr create-repository --repository-name pharmacy-frontend --region $AWS_REGION 2>/dev/null || echo "Frontend repository already exists"
aws ecr create-repository --repository-name pharmacy-backend --region $AWS_REGION 2>/dev/null || echo "Backend repository already exists"

# Login to ECR
echo "Logging in to ECR..."
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com

echo -e "${GREEN}✅ ECR repositories ready${NC}"

# Step 2: Build and Push Docker Images
echo -e "\n${YELLOW}Step 2: Building and pushing Docker images...${NC}"

# Build backend
echo "Building backend image..."
docker build -t pharmacy-backend ./backend
docker tag pharmacy-backend:latest $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/pharmacy-backend:latest

# Build frontend
echo "Building frontend image..."
docker build -t pharmacy-frontend ./frontend
docker tag pharmacy-frontend:latest $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/pharmacy-frontend:latest

# Push images
echo "Pushing images to ECR..."
docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/pharmacy-backend:latest
docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/pharmacy-frontend:latest

echo -e "${GREEN}✅ Docker images pushed to ECR${NC}"

# Step 3: Create or Update ECS Cluster
echo -e "\n${YELLOW}Step 3: Setting up ECS cluster...${NC}"
aws ecs create-cluster --cluster-name $CLUSTER_NAME --region $AWS_REGION 2>/dev/null || echo "Cluster already exists"

# Step 4: Create Task Definitions
echo -e "\n${YELLOW}Step 4: Creating task definitions...${NC}"

# Create backend task definition
cat > backend-task-def.json << EOF
{
  "family": "pharmacy-backend",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512",
  "executionRoleArn": "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy",
  "containerDefinitions": [
    {
      "name": "pharmacy-backend",
      "image": "$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/pharmacy-backend:latest",
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
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/pharmacy-backend",
          "awslogs-region": "$AWS_REGION",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
EOF

# Create frontend task definition
cat > frontend-task-def.json << EOF
{
  "family": "pharmacy-frontend",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512",
  "executionRoleArn": "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy",
  "containerDefinitions": [
    {
      "name": "pharmacy-frontend",
      "image": "$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/pharmacy-frontend:latest",
      "portMappings": [
        {
          "containerPort": 3000,
          "protocol": "tcp"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/pharmacy-frontend",
          "awslogs-region": "$AWS_REGION",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
EOF

# Register task definitions
aws ecs register-task-definition --cli-input-json file://backend-task-def.json --region $AWS_REGION
aws ecs register-task-definition --cli-input-json file://frontend-task-def.json --region $AWS_REGION

echo -e "${GREEN}✅ Task definitions created${NC}"

# Step 5: Create CloudWatch Log Groups
echo -e "\n${YELLOW}Step 5: Creating CloudWatch log groups...${NC}"
aws logs create-log-group --log-group-name /ecs/pharmacy-backend --region $AWS_REGION 2>/dev/null || echo "Backend log group already exists"
aws logs create-log-group --log-group-name /ecs/pharmacy-frontend --region $AWS_REGION 2>/dev/null || echo "Frontend log group already exists"

echo -e "${GREEN}✅ Log groups created${NC}"

# Step 6: Get default VPC and subnets
echo -e "\n${YELLOW}Step 6: Getting VPC configuration...${NC}"
DEFAULT_VPC_ID=$(aws ec2 describe-vpcs --filters "Name=isDefault,Values=true" --query 'Vpcs[0].VpcId' --output text --region $AWS_REGION)
DEFAULT_SUBNETS=$(aws ec2 describe-subnets --filters "Name=vpc-id,Values=$DEFAULT_VPC_ID" --query 'Subnets[?MapPublicIpOnLaunch==`true`].SubnetId' --output text --region $AWS_REGION)
SUBNET_1=$(echo $DEFAULT_SUBNETS | cut -d' ' -f1)
SUBNET_2=$(echo $DEFAULT_SUBNETS | cut -d' ' -f2)

echo "Using VPC: $DEFAULT_VPC_ID"
echo "Using subnets: $SUBNET_1, $SUBNET_2"

# Step 7: Create or Update Services
echo -e "\n${YELLOW}Step 7: Creating ECS services...${NC}"

# Check if services exist
BACKEND_EXISTS=$(aws ecs describe-services --cluster $CLUSTER_NAME --services $BACKEND_SERVICE --region $AWS_REGION --query 'services[0].status' --output text 2>/dev/null || echo "NONE")
FRONTEND_EXISTS=$(aws ecs describe-services --cluster $CLUSTER_NAME --services $FRONTEND_SERVICE --region $AWS_REGION --query 'services[0].status' --output text 2>/dev/null || echo "NONE")

if [ "$BACKEND_EXISTS" = "ACTIVE" ]; then
    echo "Updating backend service..."
    aws ecs update-service --cluster $CLUSTER_NAME --service $BACKEND_SERVICE --task-definition pharmacy-backend --region $AWS_REGION
else
    echo "Creating backend service..."
    aws ecs create-service \
        --cluster $CLUSTER_NAME \
        --service-name $BACKEND_SERVICE \
        --task-definition pharmacy-backend \
        --desired-count 1 \
        --launch-type FARGATE \
        --network-configuration "awsvpcConfiguration={subnets=[$SUBNET_1,$SUBNET_2],assignPublicIp=ENABLED}" \
        --region $AWS_REGION
fi

if [ "$FRONTEND_EXISTS" = "ACTIVE" ]; then
    echo "Updating frontend service..."
    aws ecs update-service --cluster $CLUSTER_NAME --service $FRONTEND_SERVICE --task-definition pharmacy-frontend --region $AWS_REGION
else
    echo "Creating frontend service..."
    aws ecs create-service \
        --cluster $CLUSTER_NAME \
        --service-name $FRONTEND_SERVICE \
        --task-definition pharmacy-frontend \
        --desired-count 1 \
        --launch-type FARGATE \
        --network-configuration "awsvpcConfiguration={subnets=[$SUBNET_1,$SUBNET_2],assignPublicIp=ENABLED}" \
        --region $AWS_REGION
fi

echo -e "${GREEN}✅ ECS services created/updated${NC}"

# Step 8: Wait for services to be stable
echo -e "\n${YELLOW}Step 8: Waiting for services to be stable...${NC}"
echo "Waiting for backend service to be stable..."
aws ecs wait services-stable --cluster $CLUSTER_NAME --services $BACKEND_SERVICE --region $AWS_REGION

echo "Waiting for frontend service to be stable..."
aws ecs wait services-stable --cluster $CLUSTER_NAME --services $FRONTEND_SERVICE --region $AWS_REGION

echo -e "${GREEN}✅ Services are stable${NC}"

# Step 9: Get service information
echo -e "\n${YELLOW}Step 9: Getting service information...${NC}"

BACKEND_TASKS=$(aws ecs list-tasks --cluster $CLUSTER_NAME --service-name $BACKEND_SERVICE --region $AWS_REGION --query 'taskArns' --output text)
FRONTEND_TASKS=$(aws ecs list-tasks --cluster $CLUSTER_NAME --service-name $FRONTEND_SERVICE --region $AWS_REGION --query 'taskArns' --output text)

if [ ! -z "$BACKEND_TASKS" ]; then
    BACKEND_IP=$(aws ecs describe-tasks --cluster $CLUSTER_NAME --tasks $BACKEND_TASKS --region $AWS_REGION --query 'tasks[0].attachments[0].details[?name==`privateIPv4Address`].value' --output text)
    echo "Backend service IP: $BACKEND_IP"
fi

if [ ! -z "$FRONTEND_TASKS" ]; then
    FRONTEND_IP=$(aws ecs describe-tasks --cluster $CLUSTER_NAME --tasks $FRONTEND_TASKS --region $AWS_REGION --query 'tasks[0].attachments[0].details[?name==`privateIPv4Address`].value' --output text)
    echo "Frontend service IP: $FRONTEND_IP"
fi

# Step 10: Clean up temporary files
echo -e "\n${YELLOW}Step 10: Cleaning up...${NC}"
rm -f backend-task-def.json frontend-task-def.json

echo -e "\n${GREEN}🎉 Deployment completed successfully!${NC}"
echo -e "\n${YELLOW}Next steps:${NC}"
echo "1. Access your frontend at: http://$FRONTEND_IP:3000"
echo "2. Access your backend API at: http://$BACKEND_IP:5000"
echo "3. Check service status: aws ecs describe-services --cluster $CLUSTER_NAME --services $FRONTEND_SERVICE $BACKEND_SERVICE --region $AWS_REGION"
echo "4. View logs: aws logs tail /ecs/pharmacy-frontend --follow --region $AWS_REGION"
echo "5. Scale services: aws ecs update-service --cluster $CLUSTER_NAME --service $FRONTEND_SERVICE --desired-count 2 --region $AWS_REGION"

echo -e "\n${GREEN}Happy coding! 🚀${NC}"
