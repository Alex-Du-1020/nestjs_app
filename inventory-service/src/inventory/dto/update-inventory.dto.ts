import { IsNumber, IsOptional, IsPositive } from 'class-validator';

export class UpdateInventoryDto {
  @IsNumber()
  @IsOptional()
  @IsPositive()
  quantity?: number;

  @IsNumber()
  @IsOptional()
  @IsPositive()
  price?: number;
}

