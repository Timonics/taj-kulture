import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { QueueService } from '../../../../shared/infrastructure/queue/queue.service';
import { LookbookPostRejectedEvent } from '../../domain/events/lookbook-post-rejected.event';

@Injectable()
export class LookbookRejectedHandler {
  constructor(private queueService: QueueService) {}

  @OnEvent('lookbook.post.rejected')
  async handle(event: LookbookPostRejectedEvent) {
    // Send push notification to user
    await this.queueService.addNotificationJob(
      event.userId,
      'Lookbook Post Rejected!',
      event.reason!,
    );
    // Could also send email
    await this.queueService.addEmailJob({
      to: 'user@example.com', // need to fetch user email
      subject: 'Your Lookbook Post is Rejected',
      template: 'lookbook-rejected',
      context: { postId: event.postId },
    });
  }
}