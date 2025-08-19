const Redis = require('ioredis');

// Redis连接配置
const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT) : 6379,
  password: process.env.REDIS_PASSWORD || undefined,
});

async function checkRedisStock() {
  try {
    console.log('Checking Redis stock data...\n');
    
    // 获取所有库存相关的键
    const keys = await redis.keys('stock:*');
    
    if (keys.length === 0) {
      console.log('No stock data found in Redis.');
      return;
    }
    
    console.log('Current stock levels:');
    console.log('====================');
    
    for (const key of keys.sort()) {
      const productId = key.split(':')[1];
      const stock = await redis.get(key);
      console.log(`Product ${productId}: ${stock} units`);
    }
    
    console.log('\nStock check completed!');
    
  } catch (error) {
    console.error('Error checking Redis stock:', error);
  } finally {
    await redis.quit();
  }
}

// 运行检查
checkRedisStock();

