const Redis = require('ioredis');

// Redis连接配置
const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT) : 6379,
  password: process.env.REDIS_PASSWORD || undefined,
});

// 初始库存数据
const initialStock = [
  { productId: 1, quantity: 100 },
  { productId: 2, quantity: 80 },
  { productId: 3, quantity: 50 },
  { productId: 4, quantity: 120 },
  { productId: 5, quantity: 200 },
];

async function initializeRedisStock() {
  try {
    console.log('Initializing Redis stock data...');
    
    for (const item of initialStock) {
      const key = `stock:${item.productId}`;
      await redis.set(key, item.quantity);
      console.log(`Set stock for product ${item.productId}: ${item.quantity}`);
    }
    
    console.log('Redis stock initialization completed successfully!');
    
    // 验证数据
    console.log('\nVerifying stock data:');
    for (const item of initialStock) {
      const key = `stock:${item.productId}`;
      const stock = await redis.get(key);
      console.log(`Product ${item.productId}: ${stock}`);
    }
    
  } catch (error) {
    console.error('Error initializing Redis stock:', error);
  } finally {
    await redis.quit();
  }
}

// 运行初始化
initializeRedisStock();

