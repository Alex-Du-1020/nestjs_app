# 部署指南

本文档详细说明如何在不同环境中部署 NestJS 微服务系统。

## 📋 部署前准备

### 系统要求

- **操作系统**: Linux (Ubuntu 20.04+ 推荐) / macOS / Windows
- **Docker**: 20.10+
- **Docker Compose**: 2.0+
- **内存**: 最少 4GB，推荐 8GB+
- **磁盘空间**: 最少 10GB 可用空间
- **网络**: 确保以下端口可用
  - 3001: 用户服务
  - 3002: 订单服务
  - 3003: 库存服务
  - 3306: MySQL
  - 6379: Redis
  - 9092: Kafka

### 环境检查

```bash
# 检查 Docker 版本
docker --version
docker-compose --version

# 检查端口占用
netstat -tulpn | grep -E ':(3001|3002|3003|3306|6379|9092)'

# 检查磁盘空间
df -h

# 检查内存
free -h
```

## 🚀 快速部署

### 1. 获取源码

```bash
# 克隆项目（如果从 Git 仓库）
git clone <repository-url>
cd nestjs-microservices-demo

# 或者解压源码包
tar -xzf nestjs-microservices-demo.tar.gz
cd nestjs-microservices-demo
```

### 2. 配置环境变量

```bash
# 复制并编辑环境变量文件
cp user-service/.env.example user-service/.env
cp order-service/.env.example order-service/.env
cp inventory-service/.env.example inventory-service/.env

# 修改数据库密码、JWT 密钥等敏感信息
```

### 3. 一键部署

```bash
# 生产环境部署
./scripts/start-prod.sh

# 等待服务启动完成（约 2-3 分钟）
# 检查服务状态
docker-compose ps
```

### 4. 验证部署

```bash
# 检查服务健康状态
curl http://localhost:3001/api
curl http://localhost:3002/api
curl http://localhost:3003/api

# 初始化库存数据
curl -X POST http://localhost:3003/api/inventory/initialize

# 检查库存状态
curl http://localhost:3002/api/stock
```

## 🔧 详细部署步骤

### 开发环境部署

适用于开发和测试环境：

```bash
# 1. 启动基础设施服务
./scripts/start-dev.sh

# 2. 安装依赖并启动各个服务
# 终端 1: 用户服务
cd user-service
npm install
npm run start:dev

# 终端 2: 订单服务
cd order-service
npm install
npm run start:dev

# 终端 3: 库存服务
cd inventory-service
npm install
npm run start:dev
```

### 生产环境部署

适用于生产环境：

```bash
# 1. 构建所有服务
./scripts/build-all.sh

# 2. 启动所有服务
docker-compose up -d

# 3. 等待服务就绪
sleep 60

# 4. 检查服务状态
docker-compose ps

# 5. 初始化数据
curl -X POST http://localhost:3003/api/inventory/initialize
node scripts/init-redis-stock.js
```

## 🔒 安全配置

### 1. 更改默认密码

```bash
# 修改 MySQL root 密码
docker-compose exec mysql mysql -u root -ppassword -e "ALTER USER 'root'@'%' IDENTIFIED BY 'new_secure_password';"

# 更新环境变量文件中的密码
sed -i 's/DB_PASSWORD=password/DB_PASSWORD=new_secure_password/g' */env
```

### 2. 生成安全的 JWT 密钥

```bash
# 生成随机 JWT 密钥
openssl rand -base64 64

# 更新所有服务的 JWT_SECRET
```

### 3. 配置防火墙

```bash
# Ubuntu/Debian
sudo ufw allow 3001/tcp
sudo ufw allow 3002/tcp
sudo ufw allow 3003/tcp
sudo ufw deny 3306/tcp  # 仅内部访问
sudo ufw deny 6379/tcp  # 仅内部访问
sudo ufw deny 9092/tcp  # 仅内部访问
```

### 4. 启用 HTTPS

```bash
# 使用 nginx 反向代理配置 SSL
# 配置文件示例：/etc/nginx/sites-available/microservices

server {
    listen 443 ssl;
    server_name your-domain.com;
    
    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;
    
    location /api/users/ {
        proxy_pass http://localhost:3001/api/users/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    location /api/orders/ {
        proxy_pass http://localhost:3002/api/orders/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    location /api/inventory/ {
        proxy_pass http://localhost:3003/api/inventory/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## 📊 监控和日志

### 1. 日志配置

```bash
# 配置日志轮转
sudo tee /etc/logrotate.d/microservices << EOF
/var/log/microservices/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 root root
}
EOF
```

### 2. 监控脚本

```bash
# 创建健康检查脚本
cat > health-check.sh << 'EOF'
#!/bin/bash

services=("3001" "3002" "3003")
for port in "${services[@]}"; do
    if curl -f -s http://localhost:$port/api > /dev/null; then
        echo "Service on port $port: OK"
    else
        echo "Service on port $port: FAILED"
        # 发送告警通知
        # mail -s "Service Alert" admin@example.com < /dev/null
    fi
done
EOF

chmod +x health-check.sh

# 添加到 crontab 每分钟检查一次
echo "* * * * * /path/to/health-check.sh" | crontab -
```

### 3. 性能监控

```bash
# 使用 Docker stats 监控资源使用
docker stats --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}"

# 监控数据库连接数
docker-compose exec mysql mysql -u root -ppassword -e "SHOW STATUS LIKE 'Threads_connected'"

# 监控 Redis 内存使用
docker-compose exec redis redis-cli info memory
```

## 🔄 备份和恢复

### 1. 数据库备份

```bash
# 创建备份脚本
cat > backup.sh << 'EOF'
#!/bin/bash

BACKUP_DIR="/backup/mysql"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# 备份所有数据库
docker-compose exec mysql mysqldump -u root -ppassword --all-databases > $BACKUP_DIR/all_databases_$DATE.sql

# 压缩备份文件
gzip $BACKUP_DIR/all_databases_$DATE.sql

# 删除 7 天前的备份
find $BACKUP_DIR -name "*.sql.gz" -mtime +7 -delete

echo "Backup completed: all_databases_$DATE.sql.gz"
EOF

chmod +x backup.sh

# 设置每日自动备份
echo "0 2 * * * /path/to/backup.sh" | crontab -
```

### 2. Redis 数据备份

```bash
# Redis 数据备份
docker-compose exec redis redis-cli BGSAVE

# 复制 RDB 文件
docker cp $(docker-compose ps -q redis):/data/dump.rdb ./backup/redis_$(date +%Y%m%d).rdb
```

### 3. 数据恢复

```bash
# 恢复 MySQL 数据
docker-compose exec -T mysql mysql -u root -ppassword < backup/all_databases_20231201_020000.sql

# 恢复 Redis 数据
docker-compose stop redis
docker cp backup/redis_20231201.rdb $(docker-compose ps -q redis):/data/dump.rdb
docker-compose start redis
```

## 🚀 扩展部署

### 1. 水平扩展

```bash
# 扩展订单服务到 3 个实例
docker-compose up -d --scale order-service=3

# 配置负载均衡器（nginx）
upstream order_service {
    server localhost:3002;
    server localhost:3004;
    server localhost:3005;
}
```

### 2. 多环境部署

```bash
# 创建不同环境的配置文件
cp docker-compose.yml docker-compose.staging.yml
cp docker-compose.yml docker-compose.production.yml

# 修改配置文件中的环境变量和资源限制

# 部署到不同环境
docker-compose -f docker-compose.staging.yml up -d
docker-compose -f docker-compose.production.yml up -d
```

### 3. Kubernetes 部署

```yaml
# k8s/namespace.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: microservices

---
# k8s/user-service.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: user-service
  namespace: microservices
spec:
  replicas: 2
  selector:
    matchLabels:
      app: user-service
  template:
    metadata:
      labels:
        app: user-service
    spec:
      containers:
      - name: user-service
        image: user-service:latest
        ports:
        - containerPort: 3001
        env:
        - name: DB_HOST
          value: "mysql-service"
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: jwt-secret
              key: secret
```

## 🔍 故障排除

### 常见部署问题

1. **端口冲突**
   ```bash
   # 查找占用端口的进程
   lsof -i :3001
   
   # 终止进程
   kill -9 <PID>
   ```

2. **内存不足**
   ```bash
   # 增加 swap 空间
   sudo fallocate -l 2G /swapfile
   sudo chmod 600 /swapfile
   sudo mkswap /swapfile
   sudo swapon /swapfile
   ```

3. **磁盘空间不足**
   ```bash
   # 清理 Docker 镜像和容器
   docker system prune -a
   
   # 清理日志文件
   sudo journalctl --vacuum-time=7d
   ```

4. **服务启动失败**
   ```bash
   # 查看详细日志
   docker-compose logs --tail=100 user-service
   
   # 重启特定服务
   docker-compose restart user-service
   ```

### 性能优化

1. **数据库优化**
   ```sql
   -- 添加索引
   CREATE INDEX idx_orders_user_id ON orders(userId);
   CREATE INDEX idx_orders_product_id ON orders(productId);
   CREATE INDEX idx_inventory_product_id ON inventory(productId);
   ```

2. **Redis 优化**
   ```bash
   # 配置 Redis 内存策略
   docker-compose exec redis redis-cli CONFIG SET maxmemory-policy allkeys-lru
   ```

3. **应用优化**
   ```bash
   # 设置 Node.js 内存限制
   export NODE_OPTIONS="--max-old-space-size=2048"
   ```

## 📞 技术支持

如遇到部署问题，请按以下步骤收集信息：

1. **系统信息**
   ```bash
   uname -a
   docker --version
   docker-compose --version
   ```

2. **服务状态**
   ```bash
   docker-compose ps
   docker-compose logs --tail=50
   ```

3. **资源使用**
   ```bash
   docker stats --no-stream
   df -h
   free -h
   ```

4. **网络连接**
   ```bash
   netstat -tulpn | grep -E ':(3001|3002|3003)'
   ```

将以上信息提供给技术支持团队以便快速定位问题。

