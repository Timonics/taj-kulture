import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { APP_GUARD } from '@nestjs/core';
import configuration from './config/configuration';
import { PrismaModule } from './shared/infrastructure/database/prisma.module';
import { RedisModule } from './shared/infrastructure/redis/redis.module';
import { QueueModule } from './shared/infrastructure/queue/queue.module';
import { AuthModule } from './modules/auth/auth.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { CloudinaryModule } from './shared/infrastructure/cloudinary/cloudinary.module';
import { UploadModule } from './modules/upload/upload.module';

@Module({
  imports: [
    ConfigModule.forRoot({ load: [configuration], isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 10 }]),
    EventEmitterModule.forRoot(),
    PrismaModule,
    RedisModule,
    QueueModule,
    AuthModule,
    CloudinaryModule,
    UploadModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
  ],
})
export class AppModule {}