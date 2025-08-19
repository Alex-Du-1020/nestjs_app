#!/bin/bash

echo "Building all microservices..."

# 构建用户服务
echo "Building user-service..."
cd user-service
npm run build
cd ..

# 构建订单服务
echo "Building order-service..."
cd order-service
npm run build
cd ..

# 构建库存服务
echo "Building inventory-service..."
cd inventory-service
npm run build
cd ..

echo "All services built successfully!"

