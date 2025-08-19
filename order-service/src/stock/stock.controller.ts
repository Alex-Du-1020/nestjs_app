import { Controller, Get, Post, Put, Body, Param, Delete } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';

@Controller('stock')
export class StockController {
  constructor(private readonly redisService: RedisService) {}

  @Get()
  async getAllStock() {
    const stock = await this.redisService.getAllStock();
    return {
      message: 'Stock retrieved successfully',
      stock,
    };
  }

  @Get(':productId')
  async getStock(@Param('productId') productId: number) {
    const quantity = await this.redisService.getStock(productId);
    return {
      message: 'Stock retrieved successfully',
      productId,
      quantity,
    };
  }

  @Put(':productId')
  async setStock(
    @Param('productId') productId: number,
    @Body('quantity') quantity: number,
  ) {
    await this.redisService.setStock(productId, quantity);
    return {
      message: 'Stock updated successfully',
      productId,
      quantity,
    };
  }

  @Post('batch')
  async batchSetStock(@Body() stockData: { productId: number; quantity: number }[]) {
    await this.redisService.batchSetStock(stockData);
    return {
      message: 'Batch stock update completed successfully',
      count: stockData.length,
    };
  }

  @Delete()
  async clearAllStock() {
    await this.redisService.clearAllStock();
    return {
      message: 'All stock cleared successfully',
    };
  }

  @Get('health/check')
  async healthCheck() {
    const isHealthy = await this.redisService.healthCheck();
    return {
      message: 'Redis health check completed',
      healthy: isHealthy,
    };
  }
}

