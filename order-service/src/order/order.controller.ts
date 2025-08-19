import { Controller, Post, Get, Body, UseGuards, Request, Param, Put } from '@nestjs/common';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  async createOrder(@Body() createOrderDto: CreateOrderDto, @Request() req) {
    return this.orderService.createOrder(createOrderDto, req.user.id);
  }

  @Get()
  async getOrders(@Request() req) {
    return this.orderService.getOrdersByUser(req.user.id);
  }

  @Get(':id')
  async getOrder(@Param('id') id: number, @Request() req) {
    return this.orderService.getOrderById(id, req.user.id);
  }

  @Put(':id/cancel')
  async cancelOrder(@Param('id') id: number, @Request() req) {
    return this.orderService.cancelOrder(id, req.user.id);
  }
}

