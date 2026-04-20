import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { QueueService } from '../../../../shared/infrastructure/queue/queue.service';
import { LookbookPostApprovedEvent } from '../../domain/events/lookbook-post-approved.event';

@Injectable()
export class LookbookApprovedHandler {
  constructor(private queueService: QueueService) {}

  @OnEvent('lookbook.post.approved')
  async handle(event: LookbookPostApprovedEvent) {
    // Send push notification to user
    await this.queueService.addNotificationJob(
      event.userId,
      'Lookbook Post Approved!',
      'Your outfit is now featured in the TAJ Kulture gallery. 🎉',
    );
    // Could also send email
    await this.queueService.addEmailJob({
      to: 'user@example.com', // need to fetch user email
      subject: 'Your Lookbook Post is Live',
      template: 'lookbook-approved',
      context: { postId: event.postId },
    });
  }
}