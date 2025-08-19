import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { CreateInventoryDto } from './dto/create-inventory.dto';
import { UpdateInventoryDto } from './dto/update-inventory.dto';

@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Post()
  async createInventory(@Body() createInventoryDto: CreateInventoryDto) {
    return this.inventoryService.createInventory(createInventoryDto);
  }

  @Get()
  async getAllInventory() {
    return this.inventoryService.getAllInventory();
  }

  @Get(':productId')
  async getInventory(@Param('productId') productId: number) {
    return this.inventoryService.getInventoryByProductId(productId);
  }

  @Put(':productId')
  async updateInventory(
    @Param('productId') productId: number,
    @Body() updateInventoryDto: UpdateInventoryDto,
  ) {
    return this.inventoryService.updateInventory(productId, updateInventoryDto);
  }

  @Delete(':productId')
  async deleteInventory(@Param('productId') productId: number) {
    return this.inventoryService.deleteInventory(productId);
  }

  @Post('initialize')
  async initializeInventory() {
    await this.inventoryService.initializeInventory();
    return { message: 'Inventory initialized successfully' };
  }
}

