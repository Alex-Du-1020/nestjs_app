import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private redis: Redis;
  private readonly logger = new Logger(RedisService.name);

  async onModuleInit() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT) : 6379,
      password: process.env.REDIS_PASSWORD || undefined,
      retryDelayOnFailover: 100,
      enableReadyCheck: true,
      maxRetriesPerRequest: 3,
    });

    this.redis.on('connect', () => {
      this.logger.log('Connected to Redis');
    });

    this.redis.on('error', (error) => {
      this.logger.error('Redis connection error:', error);
    });
  }

  async onModuleDestroy() {
    await this.redis.quit();
  }

  /**
   * 原子性检查并扣减库存
   * 使用Lua脚本确保操作的原子性，防止并发问题
   */
  async checkAndDecrementStock(productId: number, quantity: number): Promise<boolean> {
    const key = `stock:${productId}`;
    
    // Lua脚本确保原子性操作
    const luaScript = `
      local key = KEYS[1]
      local quantity = tonumber(ARGV[1])
      local current = tonumber(redis.call('GET', key) or 0)
      
      if current >= quantity then
        redis.call('DECRBY', key, quantity)
        return 1
      else
        return 0
      end
    `;

    try {
      const result = await this.redis.eval(luaScript, 1, key, quantity.toString());
      const success = result === 1;
      
      this.logger.log(`Stock check for product ${productId}, quantity ${quantity}: ${success ? 'SUCCESS' : 'FAILED'}`);
      
      return success;
    } catch (error) {
      this.logger.error(`Error checking stock for product ${productId}:`, error);
      return false;
    }
  }

  /**
   * 增加库存（回滚操作）
   */
  async incrementStock(productId: number, quantity: number): Promise<void> {
    const key = `stock:${productId}`;
    
    try {
      await this.redis.incrby(key, quantity);
      this.logger.log(`Stock incremented for product ${productId}, quantity ${quantity}`);
    } catch (error) {
      this.logger.error(`Error incrementing stock for product ${productId}:`, error);
      throw error;
    }
  }

  /**
   * 获取当前库存
   */
  async getStock(productId: number): Promise<number> {
    const key = `stock:${productId}`;
    
    try {
      const stock = await this.redis.get(key);
      return parseInt(stock || '0');
    } catch (error) {
      this.logger.error(`Error getting stock for product ${productId}:`, error);
      return 0;
    }
  }

  /**
   * 设置库存
   */
  async setStock(productId: number, quantity: number): Promise<void> {
    const key = `stock:${productId}`;
    
    try {
      await this.redis.set(key, quantity);
      this.logger.log(`Stock set for product ${productId}: ${quantity}`);
    } catch (error) {
      this.logger.error(`Error setting stock for product ${productId}:`, error);
      throw error;
    }
  }

  /**
   * 批量设置库存
   */
  async batchSetStock(stockData: { productId: number; quantity: number }[]): Promise<void> {
    const pipeline = this.redis.pipeline();
    
    for (const item of stockData) {
      const key = `stock:${item.productId}`;
      pipeline.set(key, item.quantity);
    }
    
    try {
      await pipeline.exec();
      this.logger.log(`Batch stock update completed for ${stockData.length} products`);
    } catch (error) {
      this.logger.error('Error in batch stock update:', error);
      throw error;
    }
  }

  /**
   * 获取所有库存信息
   */
  async getAllStock(): Promise<{ productId: number; quantity: number }[]> {
    try {
      const keys = await this.redis.keys('stock:*');
      const result = [];
      
      for (const key of keys) {
        const productId = parseInt(key.split(':')[1]);
        const quantity = await this.redis.get(key);
        result.push({
          productId,
          quantity: parseInt(quantity || '0'),
        });
      }
      
      return result.sort((a, b) => a.productId - b.productId);
    } catch (error) {
      this.logger.error('Error getting all stock:', error);
      return [];
    }
  }

  /**
   * 清除所有库存数据
   */
  async clearAllStock(): Promise<void> {
    try {
      const keys = await this.redis.keys('stock:*');
      if (keys.length > 0) {
        await this.redis.del(...keys);
        this.logger.log(`Cleared ${keys.length} stock entries`);
      }
    } catch (error) {
      this.logger.error('Error clearing stock:', error);
      throw error;
    }
  }

  /**
   * 健康检查
   */
  async healthCheck(): Promise<boolean> {
    try {
      const result = await this.redis.ping();
      return result === 'PONG';
    } catch (error) {
      this.logger.error('Redis health check failed:', error);
      return false;
    }
  }
}

