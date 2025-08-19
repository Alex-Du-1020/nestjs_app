#!/bin/bash

echo "Starting development environment..."

# 启动基础设施服务 (MySQL, Redis, Kafka)
docker-compose -f docker-compose.dev.yml up -d

echo "Waiting for services to be ready..."
sleep 30

echo "Infrastructure services started successfully!"
echo ""
echo "Services available at:"
echo "- MySQL: localhost:3306"
echo "- Redis: localhost:6379"
echo "- Kafka: localhost:9092"
echo ""
echo "You can now start the microservices manually:"
echo "1. User Service: cd user-service && npm run start:dev"
echo "2. Order Service: cd order-service && npm run start:dev"
echo "3. Inventory Service: cd inventory-service && npm run start:dev"

