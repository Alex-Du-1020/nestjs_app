import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order, OrderStatus } from './order.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { KafkaService } from '../kafka/kafka.service';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    private kafkaService: KafkaService,
    private redisService: RedisService,
  ) {}

  async createOrder(createOrderDto: CreateOrderDto, userId: number) {
    const { productId, productName, price, quantity } = createOrderDto;
    const totalAmount = price * quantity;

    // 1. 检查Redis中的库存并预扣减
    const stockAvailable = await this.redisService.checkAndDecrementStock(productId, quantity);
    
    if (!stockAvailable) {
      throw new BadRequestException('Insufficient stock');
    }

    try {
      // 2. 创建订单
      const order = this.orderRepository.create({
        userId,
        productId,
        productName,
        price,
        quantity,
        totalAmount,
        status: OrderStatus.PENDING,
      });

      const savedOrder = await this.orderRepository.save(order);

      // 3. 发送消息到库存服务进行实际库存扣减
      await this.kafkaService.sendMessage('inventory-request', {
        orderId: savedOrder.id,
        productId,
        quantity,
        action: 'decrement',
      });

      return {
        message: 'Order created successfully',
        order: savedOrder,
      };
    } catch (error) {
      // 如果订单创建失败，回滚Redis库存
      await this.redisService.incrementStock(productId, quantity);
      throw error;
    }
  }

  async getOrdersByUser(userId: number) {
    const orders = await this.orderRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });

    return {
      message: 'Orders retrieved successfully',
      orders,
    };
  }

  async getOrderById(orderId: number, userId: number) {
    const order = await this.orderRepository.findOne({
      where: { id: orderId, userId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return {
      message: 'Order retrieved successfully',
      order,
    };
  }

  async cancelOrder(orderId: number, userId: number) {
    const order = await this.orderRepository.findOne({
      where: { id: orderId, userId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException('Order cannot be cancelled');
    }

    // 更新订单状态
    order.status = OrderStatus.CANCELLED;
    await this.orderRepository.save(order);

    // 回滚Redis库存
    await this.redisService.incrementStock(order.productId, order.quantity);

    // 发送消息到库存服务回滚库存
    await this.kafkaService.sendMessage('inventory-request', {
      orderId: order.id,
      productId: order.productId,
      quantity: order.quantity,
      action: 'increment',
    });

    return {
      message: 'Order cancelled successfully',
      order,
    };
  }

  async updateOrderStatus(orderId: number, status: OrderStatus) {
    const order = await this.orderRepository.findOne({ where: { id: orderId } });
    
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    order.status = status;
    await this.orderRepository.save(order);

    return order;
  }
}

