import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private redis: Redis;

  async onModuleInit() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT) : 6379,
      password: process.env.REDIS_PASSWORD || undefined,
    });
  }

  async onModuleDestroy() {
    await this.redis.quit();
  }

  async syncStockToRedis(productId: number, quantity: number): Promise<void> {
    const key = `stock:${productId}`;
    await this.redis.set(key, quantity);
  }

  async getStockFromRedis(productId: number): Promise<number> {
    const key = `stock:${productId}`;
    const stock = await this.redis.get(key);
    return parseInt(stock || '0');
  }

  async updateStockInRedis(productId: number, quantity: number): Promise<void> {
    const key = `stock:${productId}`;
    await this.redis.incrby(key, quantity);
  }
}

