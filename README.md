# NestJS 高并发订单后端微服务系统

一个基于 NestJS 的高并发订单后端系统，包含用户服务、订单服务和库存服务三个微服务，使用 Kafka 消息队列、MySQL 数据库、Redis 缓存，并实现了防超卖机制。

## 📋 目录

- [系统架构](#系统架构)
- [技术栈](#技术栈)
- [项目结构](#项目结构)
- [快速开始](#快速开始)
- [API 文档](#api-文档)
- [测试](#测试)
- [部署](#部署)
- [性能测试](#性能测试)
- [防超卖机制](#防超卖机制)
- [故障排除](#故障排除)

## 🏗️ 系统架构

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   用户服务       │    │   订单服务       │    │   库存服务       │
│  (User Service) │    │ (Order Service) │    │(Inventory Svc)  │
│     :3001       │    │     :3002       │    │     :3003       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │   消息队列       │
                    │    (Kafka)      │
                    │     :9092       │
                    └─────────────────┘
                                 │
         ┌───────────────────────┼───────────────────────┐
         │                       │                       │
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   MySQL数据库    │    │   Redis缓存     │    │   JMeter测试    │
│     :3306       │    │     :6379       │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### 核心特性

- **微服务架构**: 三个独立的 NestJS 微服务
- **JWT 认证**: 安全的用户身份验证和授权
- **消息队列**: Kafka 实现服务间异步通信
- **缓存机制**: Redis 实现高性能库存管理
- **防超卖**: 基于 Redis 原子操作的库存预扣减机制
- **容器化**: Docker Compose 一键部署
- **性能测试**: JMeter 高并发测试脚本
- **自动化测试**: Jest 完整的 API 测试套件

## 🛠️ 技术栈

### 后端框架
- **NestJS**: TypeScript 企业级 Node.js 框架
- **TypeORM**: 对象关系映射 (ORM)
- **Passport**: 身份验证中间件
- **JWT**: JSON Web Token 认证

### 数据存储
- **MySQL**: 关系型数据库
- **Redis**: 内存数据库和缓存
- **Kafka**: 分布式消息队列

### 开发工具
- **Docker**: 容器化部署
- **Jest**: 单元测试和集成测试
- **JMeter**: 性能测试
- **TypeScript**: 静态类型检查

## 📁 项目结构

```
nestjs-microservices-demo/
├── user-service/                 # 用户服务
│   ├── src/
│   │   ├── auth/                # JWT 认证模块
│   │   ├── user/                # 用户管理模块
│   │   ├── app.module.ts        # 应用主模块
│   │   └── main.ts              # 应用入口
│   ├── Dockerfile               # Docker 配置
│   └── package.json             # 依赖配置
├── order-service/               # 订单服务
│   ├── src/
│   │   ├── auth/                # JWT 认证模块
│   │   ├── order/               # 订单管理模块
│   │   ├── kafka/               # Kafka 消息队列
│   │   ├── redis/               # Redis 缓存服务
│   │   ├── stock/               # 库存管理控制器
│   │   ├── app.module.ts        # 应用主模块
│   │   └── main.ts              # 应用入口
│   ├── Dockerfile               # Docker 配置
│   └── package.json             # 依赖配置
├── inventory-service/           # 库存服务
│   ├── src/
│   │   ├── inventory/           # 库存管理模块
│   │   ├── kafka/               # Kafka 消息队列
│   │   ├── redis/               # Redis 缓存服务
│   │   ├── app.module.ts        # 应用主模块
│   │   └── main.ts              # 应用入口
│   ├── Dockerfile               # Docker 配置
│   └── package.json             # 依赖配置
├── database/                    # 数据库配置
│   └── init.sql                 # 数据库初始化脚本
├── scripts/                     # 工具脚本
│   ├── start-dev.sh             # 开发环境启动
│   ├── start-prod.sh            # 生产环境启动
│   ├── build-all.sh             # 构建所有服务
│   ├── init-redis-stock.js      # Redis 库存初始化
│   └── check-redis-stock.js     # Redis 库存检查
├── tests/                       # 测试文件
│   ├── jmeter/                  # JMeter 性能测试
│   │   ├── user-registration-test.jmx
│   │   ├── order-creation-test.jmx
│   │   ├── stress-test.jmx
│   │   └── run-tests.sh
│   └── automated/               # 自动化测试
│       ├── user-service.test.js
│       ├── order-service.test.js
│       ├── inventory-service.test.js
│       ├── integration.test.js
│       └── run-tests.sh
├── docker-compose.yml           # 生产环境 Docker 配置
├── docker-compose.dev.yml       # 开发环境 Docker 配置
├── architecture.md              # 系统架构文档
└── README.md                    # 项目说明文档
```




## 🚀 快速开始

### 环境要求

- Node.js 18+
- Docker & Docker Compose
- JMeter (可选，用于性能测试)

### 1. 克隆项目

```bash
git clone <repository-url>
cd nestjs-microservices-demo
```

### 2. 开发环境启动

启动基础设施服务（MySQL, Redis, Kafka）：

```bash
# 启动开发环境基础设施
./scripts/start-dev.sh
```

分别启动各个微服务：

```bash
# 终端1: 启动用户服务
cd user-service
npm install
npm run start:dev

# 终端2: 启动订单服务
cd order-service
npm install
npm run start:dev

# 终端3: 启动库存服务
cd inventory-service
npm install
npm run start:dev
```

### 3. 生产环境启动

```bash
# 构建并启动所有服务
./scripts/start-prod.sh
```

### 4. 初始化数据

```bash
# 初始化库存数据
node inventory-service/init-redis-stock.js

# 或通过API初始化
curl -X POST http://localhost:3003/api/inventory/initialize
```

### 5. 验证服务

```bash
# 检查服务状态
curl http://localhost:3001/api  # 用户服务
curl http://localhost:3002/api  # 订单服务
curl http://localhost:3003/api  # 库存服务

# 检查库存状态
curl http://localhost:3002/api/stock
```

## 📚 API 文档

### 用户服务 (Port: 3001)

#### 用户注册
```http
POST /api/users/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "username": "testuser"
}
```

#### 用户登录
```http
POST /api/users/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

#### 获取用户信息
```http
GET /api/users/profile
Authorization: Bearer <jwt_token>
```

#### 验证令牌
```http
POST /api/users/verify
Authorization: Bearer <jwt_token>
```

### 订单服务 (Port: 3002)

#### 创建订单
```http
POST /api/orders
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "productId": 1,
  "productName": "iPhone 15",
  "price": 999.99,
  "quantity": 1
}
```

#### 获取用户订单
```http
GET /api/orders
Authorization: Bearer <jwt_token>
```

#### 获取特定订单
```http
GET /api/orders/:id
Authorization: Bearer <jwt_token>
```

#### 取消订单
```http
PUT /api/orders/:id/cancel
Authorization: Bearer <jwt_token>
```

#### 库存管理
```http
# 获取所有库存
GET /api/stock

# 获取特定产品库存
GET /api/stock/:productId

# 更新库存
PUT /api/stock/:productId
Content-Type: application/json

{
  "quantity": 100
}
```

### 库存服务 (Port: 3003)

#### 获取所有库存
```http
GET /api/inventory
```

#### 获取特定产品库存
```http
GET /api/inventory/:productId
```

#### 创建库存记录
```http
POST /api/inventory
Content-Type: application/json

{
  "productId": 6,
  "productName": "New Product",
  "quantity": 100,
  "price": 199.99
}
```

#### 更新库存
```http
PUT /api/inventory/:productId
Content-Type: application/json

{
  "quantity": 150,
  "price": 249.99
}
```

#### 删除库存记录
```http
DELETE /api/inventory/:productId
```

#### 初始化库存数据
```http
POST /api/inventory/initialize
```


## 🧪 测试

### 自动化测试

项目包含完整的自动化测试套件，包括单元测试和集成测试。

```bash
# 进入测试目录
cd tests/automated

# 安装测试依赖
npm install

# 运行所有测试
npm test

# 运行特定服务测试
npm run test:user        # 用户服务测试
npm run test:order       # 订单服务测试
npm run test:inventory   # 库存服务测试
npm run test:integration # 集成测试

# 生成覆盖率报告
npm run test:coverage

# 或使用脚本运行
./run-tests.sh
```

### 测试覆盖范围

- **用户服务测试**: 用户注册、登录、认证、令牌验证
- **订单服务测试**: 订单创建、查询、取消、库存管理
- **库存服务测试**: 库存增删改查、数据验证
- **集成测试**: 服务间通信、数据一致性、错误处理、防超卖机制

### 性能测试

使用 JMeter 进行高并发性能测试：

```bash
# 进入 JMeter 测试目录
cd tests/jmeter

# 运行所有性能测试
./run-tests.sh

# 或手动运行特定测试
jmeter -n -t user-registration-test.jmx -l results/user-registration.jtl
jmeter -n -t order-creation-test.jmx -l results/order-creation.jtl
jmeter -n -t stress-test.jmx -l results/stress-test.jtl
```

### 测试场景

#### 1. 用户注册测试
- **并发用户**: 100
- **持续时间**: 10秒
- **测试内容**: 用户注册功能的并发性能

#### 2. 订单创建测试
- **并发用户**: 200
- **循环次数**: 5次
- **持续时间**: 30秒
- **测试内容**: 用户登录 + 订单创建的完整流程

#### 3. 高并发压力测试
- **并发用户**: 500
- **循环次数**: 10次
- **持续时间**: 60秒
- **测试内容**: 高并发下的防超卖机制验证

## 🚢 部署

### Docker Compose 部署

#### 开发环境
```bash
# 启动开发环境（仅基础设施）
docker-compose -f docker-compose.dev.yml up -d

# 停止开发环境
docker-compose -f docker-compose.dev.yml down
```

#### 生产环境
```bash
# 构建并启动所有服务
docker-compose up --build -d

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f

# 停止所有服务
docker-compose down

# 停止并删除数据卷
docker-compose down -v
```

### 环境变量配置

每个服务都有对应的 `.env` 文件，可以根据需要修改：

#### 用户服务 (.env)
```env
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=password
DB_DATABASE=user_service
JWT_SECRET=your-super-secret-jwt-key
PORT=3001
```

#### 订单服务 (.env)
```env
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=password
DB_DATABASE=order_service
JWT_SECRET=your-super-secret-jwt-key
PORT=3002
USER_SERVICE_URL=http://localhost:3001
KAFKA_BROKER=localhost:9092
REDIS_HOST=localhost
REDIS_PORT=6379
```

#### 库存服务 (.env)
```env
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=password
DB_DATABASE=inventory_service
PORT=3003
KAFKA_BROKER=localhost:9092
REDIS_HOST=localhost
REDIS_PORT=6379
```

### 健康检查

```bash
# 检查所有服务健康状态
curl http://localhost:3001/api  # 用户服务
curl http://localhost:3002/api  # 订单服务
curl http://localhost:3003/api  # 库存服务

# 检查 Redis 连接
curl http://localhost:3002/api/stock/health/check

# 检查数据库连接
docker-compose exec mysql mysql -u root -ppassword -e "SHOW DATABASES;"
```


## 🛡️ 防超卖机制

系统采用多层防超卖机制确保在高并发场景下不会出现超卖问题：

### 1. Redis 原子操作

使用 Redis 的 Lua 脚本实现原子性的库存检查和扣减：

```lua
local key = KEYS[1]
local quantity = tonumber(ARGV[1])
local current = tonumber(redis.call('GET', key) or 0)

if current >= quantity then
  redis.call('DECRBY', key, quantity)
  return 1
else
  return 0
end
```

### 2. 预扣减机制

- **第一步**: 用户下单时，先在 Redis 中进行库存预扣减
- **第二步**: 预扣减成功后创建订单记录
- **第三步**: 通过 Kafka 消息队列通知库存服务进行实际扣减
- **第四步**: 如果任何步骤失败，自动回滚 Redis 库存

### 3. 消息队列异步处理

- 订单服务和库存服务通过 Kafka 异步通信
- 避免同步调用造成的性能瓶颈
- 提供消息重试和错误处理机制

### 4. 数据一致性保证

- Redis 缓存与 MySQL 数据库的双写一致性
- 库存服务更新数据库后同步更新 Redis
- 定期同步机制确保数据一致性

### 防超卖测试验证

```bash
# 运行高并发压力测试验证防超卖机制
cd tests/jmeter
./run-tests.sh

# 检查测试结果中的成功/失败订单比例
# 验证最终库存不会为负数
curl http://localhost:3002/api/stock/1
```

## ⚡ 性能优化

### 1. 缓存策略
- Redis 缓存热点商品库存信息
- 减少数据库查询压力
- 提高响应速度

### 2. 连接池优化
- MySQL 连接池配置
- Redis 连接复用
- Kafka 生产者/消费者优化

### 3. 异步处理
- 消息队列异步处理库存更新
- 非阻塞 I/O 操作
- 事件驱动架构

### 4. 负载均衡
- 支持水平扩展
- 微服务独立部署
- 容器化支持

## 🔧 故障排除

### 常见问题

#### 1. 服务启动失败

**问题**: 服务无法启动或连接失败

**解决方案**:
```bash
# 检查端口占用
netstat -tulpn | grep :3001
netstat -tulpn | grep :3002
netstat -tulpn | grep :3003

# 检查 Docker 服务状态
docker-compose ps

# 查看服务日志
docker-compose logs user-service
docker-compose logs order-service
docker-compose logs inventory-service
```

#### 2. 数据库连接问题

**问题**: 无法连接到 MySQL 数据库

**解决方案**:
```bash
# 检查 MySQL 容器状态
docker-compose exec mysql mysql -u root -ppassword -e "SELECT 1"

# 重启 MySQL 服务
docker-compose restart mysql

# 检查数据库初始化
docker-compose exec mysql mysql -u root -ppassword -e "SHOW DATABASES"
```

#### 3. Redis 连接问题

**问题**: Redis 连接失败或数据不一致

**解决方案**:
```bash
# 检查 Redis 连接
docker-compose exec redis redis-cli ping

# 检查 Redis 数据
docker-compose exec redis redis-cli keys "stock:*"

# 重新初始化 Redis 库存
node scripts/init-redis-stock.js
```

#### 4. Kafka 消息问题

**问题**: 消息队列无法正常工作

**解决方案**:
```bash
# 检查 Kafka 容器状态
docker-compose ps kafka zookeeper

# 重启 Kafka 服务
docker-compose restart kafka zookeeper

# 检查 Kafka 主题
docker-compose exec kafka kafka-topics --bootstrap-server localhost:9092 --list
```

#### 5. JWT 认证问题

**问题**: 令牌验证失败

**解决方案**:
```bash
# 检查 JWT_SECRET 环境变量是否一致
grep JWT_SECRET */env

# 重新生成用户令牌
curl -X POST http://localhost:3001/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

### 日志查看

```bash
# 查看所有服务日志
docker-compose logs -f

# 查看特定服务日志
docker-compose logs -f user-service
docker-compose logs -f order-service
docker-compose logs -f inventory-service

# 查看基础设施日志
docker-compose logs -f mysql
docker-compose logs -f redis
docker-compose logs -f kafka
```

### 性能监控

```bash
# 检查系统资源使用
docker stats

# 检查服务响应时间
curl -w "@curl-format.txt" -o /dev/null -s http://localhost:3001/api/users/profile

# 监控数据库连接
docker-compose exec mysql mysql -u root -ppassword -e "SHOW PROCESSLIST"
```

## 📈 监控和日志

### 应用日志

每个微服务都配置了详细的日志记录：

- **用户服务**: 用户注册、登录、认证日志
- **订单服务**: 订单创建、库存检查、消息队列日志
- **库存服务**: 库存更新、消息处理日志

### 性能指标

建议监控以下关键指标：

- **响应时间**: API 接口响应时间
- **吞吐量**: 每秒处理请求数
- **错误率**: 4xx/5xx 错误比例
- **资源使用**: CPU、内存、磁盘使用率
- **数据库性能**: 连接数、查询时间
- **缓存命中率**: Redis 缓存效率

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 📞 联系方式

如有问题或建议，请通过以下方式联系：

- 创建 Issue
- 发送邮件至 [your-email@example.com]
- 项目讨论区

---

**注意**: 这是一个演示项目，生产环境使用前请进行充分的安全性和性能测试。

