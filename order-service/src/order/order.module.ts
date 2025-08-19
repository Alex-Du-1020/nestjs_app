import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { Order } from './order.entity';
import { KafkaService } from '../kafka/kafka.service';
import { RedisService } from '../redis/redis.service';
import { StockController } from '../stock/stock.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Order])],
  controllers: [OrderController, StockController],
  providers: [OrderService, KafkaService, RedisService],
  exports: [OrderService, RedisService],
})
export class OrderModule {}

