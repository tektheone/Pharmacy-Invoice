terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  
  backend "s3" {
    bucket = "pharmacy-invoice-terraform-state"
    key    = "main.tfstate"
    region = "us-east-1"
  }
}

provider "aws" {
  region = var.aws_region
  
  default_tags {
    tags = {
      Project     = "pharmacy-invoice"
      Environment = var.environment
      ManagedBy   = "terraform"
    }
  }
}

# VPC and Networking
module "vpc" {
  source = "./modules/vpc"
  
  environment = var.environment
  vpc_cidr   = var.vpc_cidr
}

# ECS Cluster
module "ecs" {
  source = "./modules/ecs"
  
  environment = var.environment
  vpc_id     = module.vpc.vpc_id
  subnet_ids = module.vpc.private_subnet_ids
}

# RDS Database
module "rds" {
  source = "./modules/rds"
  
  environment     = var.environment
  vpc_id         = module.vpc.vpc_id
  subnet_ids     = module.vpc.private_subnet_ids
  security_group = module.ecs.security_group_id
}

# S3 Bucket for file storage
module "s3" {
  source = "./modules/s3"
  
  environment = var.environment
  bucket_name = var.s3_bucket_name
}

# CloudFront CDN
module "cloudfront" {
  source = "./modules/cloudfront"
  
  environment = var.environment
  s3_bucket  = module.s3.bucket_id
}

# Application Load Balancer
module "alb" {
  source = "./modules/alb"
  
  environment = var.environment
  vpc_id     = module.vpc.vpc_id
  subnet_ids = module.vpc.public_subnet_ids
}

# ECS Services
module "backend_service" {
  source = "./modules/ecs-service"
  
  environment     = var.environment
  service_name   = "backend"
  ecs_cluster_id = module.ecs.cluster_id
  task_definition = {
    cpu    = 256
    memory = 512
    image  = "${var.ecr_repository_url}/backend:latest"
    port   = 5000
  }
  target_group_arn = module.alb.backend_target_group_arn
  security_groups  = [module.ecs.security_group_id]
  subnets          = module.vpc.private_subnet_ids
}

module "frontend_service" {
  source = "./modules/ecs-service"
  
  environment     = var.environment
  service_name   = "frontend"
  ecs_cluster_id = module.ecs.cluster_id
  task_definition = {
    cpu    = 256
    memory = 512
    image  = "${var.ecr_repository_url}/frontend:latest"
    port   = 80
  }
  target_group_arn = module.alb.frontend_target_group_arn
  security_groups  = [module.ecs.security_group_id]
  subnets          = module.vpc.private_subnet_ids
}
