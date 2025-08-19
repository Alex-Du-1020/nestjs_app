#!/bin/bash

echo "Starting production environment..."

# 构建并启动所有服务
docker-compose up --build -d

echo "Waiting for services to be ready..."
sleep 60

echo "Checking service status..."
docker-compose ps

echo ""
echo "Production environment started successfully!"
echo ""
echo "Services available at:"
echo "- User Service: http://localhost:3001/api"
echo "- Order Service: http://localhost:3002/api"
echo "- Inventory Service: http://localhost:3003/api"
echo ""
echo "Infrastructure services:"
echo "- MySQL: localhost:3306"
echo "- Redis: localhost:6379"
echo "- Kafka: localhost:9092"

