variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  default     = "dev"
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "s3_bucket_name" {
  description = "Name for S3 bucket"
  type        = string
  default     = "pharmacy-invoice-files"
}

variable "ecr_repository_url" {
  description = "ECR repository URL for Docker images"
  type        = string
  default     = "123456789012.dkr.ecr.us-east-1.amazonaws.com/pharmacy-invoice"
}

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.micro"
}

variable "db_allocated_storage" {
  description = "RDS allocated storage in GB"
  type        = number
  default     = 20
}

variable "db_username" {
  description = "RDS master username"
  type        = string
  default     = "pharmacy_admin"
}

variable "db_password" {
  description = "RDS master password"
  type        = string
  sensitive   = true
}

variable "domain_name" {
  description = "Domain name for the application"
  type        = string
  default     = "pharmacy-invoice.example.com"
}
