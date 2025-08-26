# 🚀 CI/CD Pipeline Setup Guide

This guide explains how to set up and deploy the Pharmacy Invoice Validation System using modern CI/CD practices.

## 📋 **Overview**

The CI/CD pipeline consists of:
- **GitHub Actions** for automated testing and building
- **Docker** for containerization
- **AWS ECS (Fargate)** for container orchestration
- **Terraform** for infrastructure as code
- **GitHub Container Registry** for Docker images

## 🏗️ **Architecture**

```
GitHub → GitHub Actions → Docker Build → GitHub Container Registry → AWS ECS → Production
  ↓
  ├── Test (Backend + Frontend)
  ├── Build (Docker Images)
  ├── Deploy Staging (dev branch)
  └── Deploy Production (main branch)
```

## 🚀 **Quick Start**

### **1. Prerequisites**
- AWS CLI configured with appropriate permissions
- Terraform installed
- Docker installed
- GitHub repository with Actions enabled

### **2. Local Development**
```bash
# Start all services locally
docker-compose up -d

# Access the application
# Frontend: http://localhost:3000
# Backend: http://localhost:5000
# Database: localhost:5432
```

### **3. Testing**
```bash
# Backend tests
cd backend && npm test

# Frontend tests
cd frontend && npm test

# Run GitHub Actions locally (optional)
act -j test
```

## 🔧 **Configuration**

### **Environment Variables**
Create `.env` files for each environment:

```bash
# .env.development
NODE_ENV=development
DATABASE_URL=postgresql://user:pass@localhost:5432/pharmacy_invoice
REDIS_URL=redis://localhost:6379
AWS_REGION=us-east-1
S3_BUCKET=pharmacy-invoice-dev
```

### **AWS Configuration**
```bash
# Configure AWS CLI
aws configure

# Set up ECR repositories
aws ecr create-repository --repository-name pharmacy-invoice/backend
aws ecr create-repository --repository-name pharmacy-invoice/frontend

# Get login token
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 123456789012.dkr.ecr.us-east-1.amazonaws.com
```

## 🚀 **Deployment**

### **Staging Deployment (dev branch)**
```bash
# Push to dev branch triggers staging deployment
git push origin dev

# Manual deployment
cd infrastructure
terraform init
terraform plan -var-file="staging.tfvars"
terraform apply -var-file="staging.tfvars"
```

### **Production Deployment (main branch)**
```bash
# Merge to main branch triggers production deployment
git checkout main
git merge dev
git push origin main

# Manual deployment
cd infrastructure
terraform init
terraform plan -var-file="production.tfvars"
terraform apply -var-file="production.tfvars"
```

## 📁 **File Structure**

```
├── .github/workflows/          # GitHub Actions workflows
├── backend/                    # Backend application
│   ├── Dockerfile             # Backend container
│   └── package.json
├── frontend/                   # Frontend application
│   ├── Dockerfile             # Frontend container
│   ├── nginx.conf             # Nginx configuration
│   └── package.json
├── infrastructure/             # Terraform configurations
│   ├── main.tf                # Main infrastructure
│   ├── variables.tf           # Variable definitions
│   └── modules/               # Reusable modules
├── docker-compose.yml          # Local development
└── CI_CD_SETUP.md             # This file
```

## 🔍 **Monitoring & Logging**

### **AWS CloudWatch**
- Application logs
- Performance metrics
- Error tracking

### **Health Checks**
- Backend: `/api/upload/supported-formats`
- Frontend: Static file serving
- Database: Connection pool status

## 🛠️ **Troubleshooting**

### **Common Issues**

1. **Docker Build Fails**
   ```bash
   # Check Docker daemon
   docker system info
   
   # Clean up Docker
   docker system prune -a
   ```

2. **Terraform Apply Fails**
   ```bash
   # Check AWS credentials
   aws sts get-caller-identity
   
   # Validate Terraform
   terraform validate
   ```

3. **GitHub Actions Fail**
   - Check workflow logs in GitHub
   - Verify secrets are configured
   - Check branch protection rules

### **Debug Commands**
```bash
# Check ECS service status
aws ecs describe-services --cluster pharmacy-invoice --services backend frontend

# Check RDS status
aws rds describe-db-instances --db-instance-identifier pharmacy-invoice

# Check S3 bucket
aws s3 ls s3://pharmacy-invoice-files
```

## 🔐 **Security**

### **IAM Roles**
- ECS Task Execution Role
- ECS Task Role
- RDS Access Role

### **Network Security**
- VPC with private subnets
- Security groups
- WAF rules (optional)

### **Secrets Management**
- AWS Secrets Manager for database passwords
- GitHub Secrets for sensitive values
- Environment-specific configurations

## 📈 **Scaling**

### **Auto Scaling**
- ECS Service Auto Scaling
- RDS Read Replicas
- CloudFront Edge Locations

### **Performance Optimization**
- Docker layer caching
- Multi-stage builds
- CDN optimization

## 🎯 **Next Steps**

1. **Set up AWS infrastructure** using Terraform
2. **Configure GitHub Secrets** for AWS credentials
3. **Test the pipeline** with a small change
4. **Monitor deployment** and performance
5. **Set up monitoring** and alerting

## 📚 **Resources**

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [AWS ECS Documentation](https://docs.aws.amazon.com/ecs/)
- [Terraform Documentation](https://www.terraform.io/docs)
- [Docker Documentation](https://docs.docker.com/)

---

**Happy Deploying! 🚀**
