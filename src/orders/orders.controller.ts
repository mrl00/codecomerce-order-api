import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Res,
  HttpStatus,
  UseGuards,
  Req,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto, UpdateOrderStatusDto } from './dto/create-order.dto';
import type { Response } from 'express';
import { AuthGuard } from 'src/auth/auth.guard';

@UseGuards(AuthGuard)
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  async create(
    @Body() createOrderDto: CreateOrderDto,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const order = await this.ordersService.create({
      ...createOrderDto,
      client_id: req['user'].subscriber,
    });
    res.status(HttpStatus.CREATED).json(order);
  }

  @Get()
  async findAll(@Req() req: Request, @Res() res: Response) {
    const orders = await this.ordersService.findAll(req['user'].subscriber);
    res.status(HttpStatus.OK).json(orders);
  }

  @Get(':id')
  async findOne(
    @Req() req: Request,
    @Res() res: Response,
    @Param('id') id: string,
  ) {
    const order = await this.ordersService.findOne(id, req['user'].subscriber);
    res.status(HttpStatus.OK).json(order);
  }

  @Patch(':id')
  async updateStatus(
    @Req() req: Request,
    @Res() res: Response,
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    const order = await this.ordersService.updateStatus(
      id,
      dto,
      req['user'].subscriber,
    );
    res.status(HttpStatus.OK).json(order);
  }
}
