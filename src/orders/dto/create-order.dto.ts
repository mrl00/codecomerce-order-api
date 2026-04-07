import {
  IsArray,
  IsNotEmpty,
  IsString,
  IsInt,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateOrderItemDto {
  @IsString()
  @IsNotEmpty()
  product_id: string;

  @IsInt()
  @Min(1)
  quantity: number;
}

export class CreateOrderDto {
  @IsString()
  @IsNotEmpty()
  client_id: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];
}

export class UpdateOrderStatusDto {
  @IsString()
  @IsNotEmpty()
  status: string;
}
