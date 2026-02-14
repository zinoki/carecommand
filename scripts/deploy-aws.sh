#!/bin/bash
# Deploy CareCommand to AWS ECS/Fargate
# Prerequisites: AWS CLI, Docker, ECR repo
set -e
AWS_REGION=${AWS_REGION:-us-east-1}
ECR_URI=${ECR_URI:-}
if [ -z "$ECR_URI" ]; then
  echo "Set ECR_URI (e.g. 123456789.dkr.ecr.us-east-1.amazonaws.com/carecommand)"
  exit 1
fi
docker build -f server/Dockerfile -t carecommand-server .
docker tag carecommand-server:latest $ECR_URI:latest
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ECR_URI
docker push $ECR_URI:latest
echo "Pushed. Update ECS task definition to deploy."
