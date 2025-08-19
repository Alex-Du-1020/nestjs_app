import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Kafka, Producer, Consumer } from 'kafkajs';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class KafkaService implements OnModuleInit, OnModuleDestroy {
  private kafka: Kafka;
  private producer: Producer;
  private consumer: Consumer;

  constructor(
    private redisService: RedisService
  ) {
    this.kafka = new Kafka({
      clientId: 'order-service',
      brokers: [process.env.KAFKA_BROKER || 'localhost:9092'],
    });

    this.producer = this.kafka.producer();
    this.consumer = this.kafka.consumer({ groupId: 'order-service-group' });
  }

  async onModuleInit() {
    await this.producer.connect();
    await this.consumer.connect();
    
    // 订阅库存相关主题
    await this.consumer.subscribe({ topic: 'inventory-response' });
    
    // 启动消费者
    await this.consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        console.log(`Received message from topic ${topic}:`, {
          partition,
          offset: message.offset,
          value: message.value?.toString(),
        });
        
        // 处理库存响应消息
        if (topic === 'inventory-response') {
          await this.handleInventoryResponse(JSON.parse(message.value?.toString() || '{}'));
        }
      },
    });
  }

  async onModuleDestroy() {
    await this.producer.disconnect();
    await this.consumer.disconnect();
  }

  async sendMessage(topic: string, message: any) {
    await this.producer.send({
      topic,
      messages: [
        {
          value: JSON.stringify(message),
        },
      ],
    });
  }

  private async handleInventoryResponse(message: any) {
    try {
      const { orderId, productId, quantity, action, success, message: responseMessage } = message;
      
      console.log('Handling inventory response:', message);
      
      if (!success) {
        // 库存操作失败，需要回滚Redis库存
        console.log(`Inventory operation failed for order ${orderId}: ${responseMessage}`);
        
        // 回滚Redis库存
        try {
          if (action === 'decrement') {
            // 如果是扣减操作失败，需要回滚之前扣减的库存
            await this.redisService.incrementStock(productId, quantity);
            console.log(`Rolled back Redis stock for product ${productId}, quantity ${quantity}`);
          }
        } catch (error) {
          console.error(`Error rolling back Redis stock for product ${productId}:`, error);
        }
      }
      // Note: Order status updates would need to be handled separately to avoid circular dependencies
    } catch (error) {
      console.error('Error handling inventory response:', error);
    }
  }
}

