import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { APP_GUARD } from '@nestjs/core';
import configuration from './config/configuration';
import { PrismaModule } from './shared/infrastructure/database/prisma.module';
import { RedisModule } from './shared/infrastructure/redis/redis.module';
import { QueueModule } from './shared/infrastructure/queue/queue.module';
import { CloudinaryModule } from './shared/infrastructure/cloudinary/cloudinary.module';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { ProductModule } from './modules/product/product.module';
import { OrderModule } from './modules/order/order.module';
import { ReviewModule } from './modules/review/review.module';
import { LookbookModule } from './modules/lookbook/lookbook.module';
import { UploadModule } from './modules/upload/upload.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';

@Module({
  imports: [
    ConfigModule.forRoot({ load: [configuration], isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 10 }]),
    EventEmitterModule.forRoot(),
    PrismaModule,
    RedisModule,
    QueueModule,
    CloudinaryModule,
    AuthModule,
    UserModule,
    ProductModule,
    OrderModule,
    ReviewModule,
    LookbookModule,
    UploadModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: JwtAuthGuard }],
})
export class AppModule {}
