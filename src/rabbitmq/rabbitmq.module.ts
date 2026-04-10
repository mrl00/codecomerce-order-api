import { Global, Module } from '@nestjs/common';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';

@Global()
@Module({
  imports: [
    RabbitMQModule.forRoot({
      uri: process.env.RABBITMQ_URI,
    }),
  ],
  exports: [RabbitMQModule],
})
export class RabbitmqModule { }
