#!/bin/bash

echo "Stopping production environment..."

# 停止所有服务
docker-compose down

echo "Production environment stopped successfully!"

