import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Res,
  HttpStatus,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import {
  CreateOrderDto,
  UpdateOrderStatusDto,
} from './dto/create-order.dto';
import type { Response } from 'express';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) { }

  @Post()
  async create(@Body() createOrderDto: CreateOrderDto, @Res() res: Response) {
    const order = await this.ordersService.create(createOrderDto);
    res.status(HttpStatus.CREATED).json(order);
  }

  @Get()
  async findAll(@Res() res: Response) {
    const orders = await this.ordersService.findAll();
    res.status(HttpStatus.OK).json(orders);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Res() res: Response) {
    const order = await this.ordersService.findOne(id);
    res.status(HttpStatus.OK).json(order);
  }

  @Patch(':id')
  async updateStatus(@Param('id') id: string, @Body() dto: UpdateOrderStatusDto, @Res() res: Response) {
    const order = await this.ordersService.updateStatus(id, dto);
    res.status(HttpStatus.OK).json(order);
  }
}
