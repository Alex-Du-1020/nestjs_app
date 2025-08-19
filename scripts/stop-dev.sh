#!/bin/bash

echo "Stopping development environment..."

# 停止基础设施服务
docker-compose -f docker-compose.dev.yml down

echo "Development environment stopped successfully!"

