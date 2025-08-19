# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A high-concurrency order processing microservices system built with NestJS, featuring three independent services (user, order, inventory) with Redis caching, Kafka messaging, and anti-overselling mechanisms.

## Architecture

- **User Service** (port 3001): JWT authentication, user management
- **Order Service** (port 3002): Order creation, Redis pre-deduction, Kafka messaging
- **Inventory Service** (port 3003): Stock management, Kafka message processing
- **Infrastructure**: MySQL, Redis, Kafka via Docker Compose

## Development Commands

### Quick Start
```bash
# Development environment
./scripts/start-dev.sh

# Production environment  
./scripts/start-prod.sh

# Stop services
./scripts/stop-dev.sh
./scripts/stop-prod.sh
```

### Service-Specific Commands

Each service (user-service, order-service, inventory-service) uses NestJS with these commands:

```bash
cd [service-name]
npm install
npm run start:dev    # Development with watch
npm run start:debug  # Debug mode
npm run start:prod   # Production build
npm run test         # Unit tests
npm run test:e2e     # E2E tests
npm run test:cov     # Coverage
npm run lint         # ESLint
```

### Testing

```bash
# Automated tests
cd tests/automated
npm install
npm test                     # All tests
npm run test:user           # User service
npm run test:order          # Order service  
npm run test:inventory      # Inventory service
npm run test:integration    # Cross-service integration

# Performance tests (requires JMeter)
cd tests/jmeter
./run-tests.sh
```

### Data Initialization

```bash
# Initialize Redis stock data
node scripts/init-redis-stock.js

# Check current stock
node scripts/check-redis-stock.js

# Build all services
./scripts/build-all.sh
```

## Key Patterns

### Anti-Overselling Mechanism
1. **Redis Atomic Operations**: Lua scripts for atomic stock check/decrement
2. **Pre-deduction**: Redis stock checked before order creation
3. **Kafka Messaging**: Async inventory updates between services
4. **Rollback**: Automatic Redis stock rollback on order failures

### Service Communication
- **Sync**: REST APIs between client and services
- **Async**: Kafka topics for inter-service communication
  - `inventory-request`: Order → Inventory
  - `inventory-response`: Inventory → Order

### Environment Configuration
Each service requires `.env` file with:
```env
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=password
DB_DATABASE=[service_name]
JWT_SECRET=your-secret-key
PORT=[3001|3002|3003]
REDIS_HOST=localhost
REDIS_PORT=6379
KAFKA_BROKER=localhost:9092
USER_SERVICE_URL=http://localhost:3001  # order service only
```

## API Endpoints

### User Service (3001)
- `POST /api/users/register` - User registration
- `POST /api/users/login` - User login
- `GET /api/users/profile` - Get user profile (JWT required)
- `POST /api/users/verify` - Validate JWT token

### Order Service (3002)
- `POST /api/orders` - Create order (JWT required)
- `GET /api/orders` - Get user orders (JWT required)
- `GET /api/stock` - Get all inventory
- `GET /api/stock/:productId` - Get specific product stock

### Inventory Service (3003)
- `GET /api/inventory` - Get all inventory
- `POST /api/inventory` - Create inventory item
- `PUT /api/inventory/:productId` - Update inventory
- `POST /api/inventory/initialize` - Initialize demo data

## Docker Management

```bash
# Development infrastructure only
docker-compose -f docker-compose.dev.yml up -d

# Full production deployment
docker-compose up --build -d

# View logs
docker-compose logs -f [service-name]

# Health checks
curl http://localhost:300[1-3]/api
```

## Testing Strategy

- **Unit Tests**: Service-level testing with Jest
- **Integration Tests**: Cross-service API testing
- **Performance Tests**: JMeter scripts for 500+ concurrent users
- **Anti-overselling Tests**: Verify stock consistency under load

## Common Issues & Solutions

### Port Conflicts
```bash
netstat -tulpn | grep :300[1-3]
docker-compose ps
```

### Database Connection
```bash
docker-compose exec mysql mysql -u root -ppassword -e "SHOW DATABASES;"
```

### Redis Issues
```bash
docker-compose exec redis redis-cli ping
docker-compose exec redis redis-cli keys "stock:*"
```

### Kafka Problems
```bash
docker-compose exec kafka kafka-topics --bootstrap-server localhost:9092 --list
```