import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Kafka, Producer, Consumer } from 'kafkajs';

@Injectable()
export class KafkaService implements OnModuleInit, OnModuleDestroy {
  private kafka: Kafka;
  private producer: Producer;
  private consumer: Consumer;

  constructor() {
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
    // 处理库存服务的响应
    console.log('Handling inventory response:', message);
    // 这里可以更新订单状态等
  }
}

