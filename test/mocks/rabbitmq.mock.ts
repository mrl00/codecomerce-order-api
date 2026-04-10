import { Module } from '@nestjs/common';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';

export const mockAmqpConnection = { publish: jest.fn() };

@Module({
  providers: [{ provide: AmqpConnection, useValue: mockAmqpConnection }],
  exports: [AmqpConnection],
})
export class MockRabbitmqModule { }
