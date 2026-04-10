import { Global, Module } from '@nestjs/common';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';

@Global()
@Module({
  imports: [
    RabbitMQModule.forRoot({
      exchanges: [{ name: 'orders', type: 'direct' }],
      queues: [{ name: 'order.created', exchange: 'orders', routingKey: 'OrderCreated' }],
      uri: process.env.RABBITMQ_URI,
    }),
  ],
  exports: [RabbitMQModule],
})
export class RabbitmqModule { }
