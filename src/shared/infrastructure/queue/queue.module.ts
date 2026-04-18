import { Global, Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ConfigService } from '@nestjs/config';
import { QueueService } from './queue.service';
import { EmailProcessor } from './processors/email.processor';
// import { NotificationProcessor } from './processors/notification.processor';
// import { AnalyticsProcessor } from './processors/analytics.processor';

@Global()
@Module({
  imports: [
    BullModule.forRootAsync({
      useFactory: (config: ConfigService) => ({
        redis: {
          host: config.get('redis.host'),
          port: config.get('redis.port'),
        },
      }),
      inject: [ConfigService],
    }),
    BullModule.registerQueue(
      { name: 'email' },
      { name: 'notification' },
      { name: 'analytics' },
    ),
  ],
  providers: [
    QueueService,
    EmailProcessor,
  //   NotificationProcessor,
  //   AnalyticsProcessor,
  ],
  exports: [QueueService],
})
export class QueueModule {}
