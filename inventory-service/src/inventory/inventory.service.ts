import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Inventory } from './inventory.entity';
import { CreateInventoryDto } from './dto/create-inventory.dto';
import { UpdateInventoryDto } from './dto/update-inventory.dto';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(Inventory)
    private inventoryRepository: Repository<Inventory>,
    private redisService: RedisService,
  ) {}

  async createInventory(createInventoryDto: CreateInventoryDto) {
    const { productId, productName, quantity, price } = createInventoryDto;

    // 检查产品是否已存在
    const existingInventory = await this.inventoryRepository.findOne({
      where: { productId },
    });

    if (existingInventory) {
      throw new BadRequestException('Product already exists in inventory');
    }

    // 创建库存记录
    const inventory = this.inventoryRepository.create({
      productId,
      productName,
      quantity,
      price,
    });

    const savedInventory = await this.inventoryRepository.save(inventory);

    // 同步到Redis
    await this.redisService.syncStockToRedis(productId, quantity);

    return {
      message: 'Inventory created successfully',
      inventory: savedInventory,
    };
  }

  async getAllInventory() {
    const inventory = await this.inventoryRepository.find();
    return {
      message: 'Inventory retrieved successfully',
      inventory,
    };
  }

  async getInventoryByProductId(productId: number) {
    const inventory = await this.inventoryRepository.findOne({
      where: { productId },
    });

    if (!inventory) {
      throw new NotFoundException('Product not found in inventory');
    }

    return {
      message: 'Inventory retrieved successfully',
      inventory,
    };
  }

  async updateInventory(productId: number, updateInventoryDto: UpdateInventoryDto) {
    const inventory = await this.inventoryRepository.findOne({
      where: { productId },
    });

    if (!inventory) {
      throw new NotFoundException('Product not found in inventory');
    }

    // 更新库存
    if (updateInventoryDto.quantity !== undefined) {
      inventory.quantity = updateInventoryDto.quantity;
      // 同步到Redis
      await this.redisService.syncStockToRedis(productId, updateInventoryDto.quantity);
    }

    if (updateInventoryDto.price !== undefined) {
      inventory.price = updateInventoryDto.price;
    }

    const updatedInventory = await this.inventoryRepository.save(inventory);

    return {
      message: 'Inventory updated successfully',
      inventory: updatedInventory,
    };
  }

  async decrementStock(productId: number, quantity: number) {
    const inventory = await this.inventoryRepository.findOne({
      where: { productId },
    });

    if (!inventory) {
      return {
        success: false,
        message: 'Product not found in inventory',
      };
    }

    if (inventory.quantity < quantity) {
      return {
        success: false,
        message: 'Insufficient stock',
      };
    }

    // 扣减库存
    inventory.quantity -= quantity;
    await this.inventoryRepository.save(inventory);

    // 同步到Redis
    await this.redisService.updateStockInRedis(productId, -quantity);

    return {
      success: true,
      message: 'Stock decremented successfully',
      remainingStock: inventory.quantity,
    };
  }

  async incrementStock(productId: number, quantity: number) {
    const inventory = await this.inventoryRepository.findOne({
      where: { productId },
    });

    if (!inventory) {
      return {
        success: false,
        message: 'Product not found in inventory',
      };
    }

    // 增加库存
    inventory.quantity += quantity;
    await this.inventoryRepository.save(inventory);

    // 同步到Redis
    await this.redisService.updateStockInRedis(productId, quantity);

    return {
      success: true,
      message: 'Stock incremented successfully',
      remainingStock: inventory.quantity,
    };
  }

  async deleteInventory(productId: number) {
    const inventory = await this.inventoryRepository.findOne({
      where: { productId },
    });

    if (!inventory) {
      throw new NotFoundException('Product not found in inventory');
    }

    await this.inventoryRepository.remove(inventory);

    return {
      message: 'Inventory deleted successfully',
    };
  }

  // 初始化库存数据的方法
  async initializeInventory() {
    const existingCount = await this.inventoryRepository.count();
    
    if (existingCount === 0) {
      const initialInventory = [
        { productId: 1, productName: 'iPhone 15', quantity: 100, price: 999.99 },
        { productId: 2, productName: 'Samsung Galaxy S24', quantity: 80, price: 899.99 },
        { productId: 3, productName: 'MacBook Pro', quantity: 50, price: 1999.99 },
        { productId: 4, productName: 'iPad Air', quantity: 120, price: 599.99 },
        { productId: 5, productName: 'AirPods Pro', quantity: 200, price: 249.99 },
      ];

      for (const item of initialInventory) {
        const inventory = this.inventoryRepository.create(item);
        await this.inventoryRepository.save(inventory);
        // 同步到Redis
        await this.redisService.syncStockToRedis(item.productId, item.quantity);
      }

      console.log('Initial inventory data created');
    }
  }
}

