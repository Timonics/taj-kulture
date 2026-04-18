import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { QueueService } from '../../../../shared/infrastructure/queue/queue.service';
import { UserRegisteredEvent } from '../../domain/events/user-registered.event';

@Injectable()
export class UserRegisteredHandler {
  constructor(private queueService: QueueService) {}

  @OnEvent('auth.user.registered')
  async handle(event: UserRegisteredEvent) {
    // 1. Send welcome email (async via queue)
    await this.queueService.addEmailJob({
      to: event.email,
      subject: 'Welcome to TAJ Kulture!',
      template: 'welcome',
      context: { name: event.fullName },
    });

    // 2. Send push notification (if device token stored elsewhere)
    await this.queueService.addNotificationJob(
      event.userId,
      'Welcome!',
      `Hey ${event.fullName}, start exploring street culture.`,
    );

    // 3. Analytics tracking
    await this.queueService.addAnalyticsJob('user_registered', {
      userId: event.userId,
      email: event.email,
      timestamp: event.occurredOn,
    });
  }
}