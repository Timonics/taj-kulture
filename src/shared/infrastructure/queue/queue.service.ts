import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';

@Injectable()
export class QueueService {
  constructor(
    @InjectQueue('email') private emailQueue: Queue,
    @InjectQueue('notification') private notificationQueue: Queue,
    @InjectQueue('analytics') private analyticsQueue: Queue,
  ) {}

  async addEmailJob(data: {
    to: string;
    subject: string;
    template: string;
    context: Record<string, any>;
  }) {
    await this.emailQueue.add('send', data, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 },
    });
  }

  async addNotificationJob(userId: string, title: string, body: string) {
    await this.notificationQueue.add('push', { userId, title, body });
  }

  async addAnalyticsJob(event: string, payload: any) {
    await this.analyticsQueue.add('track', { event, payload });
  }
}
