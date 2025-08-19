import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Kafka, Producer, Consumer } from 'kafkajs';
import { InventoryService } from '../inventory/inventory.service';

@Injectable()
export class KafkaService implements OnModuleInit, OnModuleDestroy {
  private kafka: Kafka;
  private producer: Producer;
  private consumer: Consumer;

  constructor(private inventoryService: InventoryService) {
    this.kafka = new Kafka({
      clientId: 'inventory-service',
      brokers: [process.env.KAFKA_BROKER || 'localhost:9092'],
    });

    this.producer = this.kafka.producer();
    this.consumer = this.kafka.consumer({ groupId: 'inventory-service-group' });
  }

  async onModuleInit() {
    await this.producer.connect();
    await this.consumer.connect();
    
    // 订阅库存请求主题
    await this.consumer.subscribe({ topic: 'inventory-request' });
    
    // 启动消费者
    await this.consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        console.log(`Received message from topic ${topic}:`, {
          partition,
          offset: message.offset,
          value: message.value?.toString(),
        });
        
        // 处理库存请求消息
        if (topic === 'inventory-request') {
          await this.handleInventoryRequest(JSON.parse(message.value?.toString() || '{}'));
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

  private async handleInventoryRequest(message: any) {
    const { orderId, productId, quantity, action } = message;
    
    try {
      let result;
      if (action === 'decrement') {
        result = await this.inventoryService.decrementStock(productId, quantity);
      } else if (action === 'increment') {
        result = await this.inventoryService.incrementStock(productId, quantity);
      }

      // 发送响应消息给订单服务
      await this.sendMessage('inventory-response', {
        orderId,
        productId,
        quantity,
        action,
        success: result.success,
        message: result.message,
      });
    } catch (error) {
      console.error('Error handling inventory request:', error);
      
      // 发送失败响应
      await this.sendMessage('inventory-response', {
        orderId,
        productId,
        quantity,
        action,
        success: false,
        message: error.message,
      });
    }
  }
}

