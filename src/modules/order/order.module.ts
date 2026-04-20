import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { OrderController } from './order.controller';
import { CartService } from './application/cart.service';
import { OrderService } from './application/order.service';
import { OrderCreatedHandler } from './application/handlers/order-created.handler';
import { OrderPaidHandler } from './application/handlers/order-paid.handler';
import { PrismaOrderRepository } from './infrastructure/order.repository.impl';
import { RedisCartRepository } from './infrastructure/cart.repository.impl';
import { PaystackService } from './infrastructure/paystack.service';
import { RedisModule } from '../../shared/infrastructure/redis/redis.module';
import { QueueModule } from '../../shared/infrastructure/queue/queue.module';
import { UserModule } from '../user/user.module';

@Module({
  imports: [HttpModule, RedisModule, QueueModule, UserModule],
  controllers: [OrderController],
  providers: [
    CartService,
    OrderService,
    OrderCreatedHandler,
    OrderPaidHandler,
    PaystackService,
    { provide: 'OrderRepository', useClass: PrismaOrderRepository },
    { provide: 'CartRepository', useClass: RedisCartRepository },
  ],
})
export class OrderModule {}
