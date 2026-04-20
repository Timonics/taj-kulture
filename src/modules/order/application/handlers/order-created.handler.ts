import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { QueueService } from '../../../../shared/infrastructure/queue/queue.service';
import { OrderCreatedEvent } from '../../domain/events/order-created.event';

@Injectable()
export class OrderCreatedHandler {
  constructor(private queueService: QueueService) {}

  @OnEvent('order.created')
  async handle(event: OrderCreatedEvent) {
    // Send order confirmation email
    await this.queueService.addEmailJob({
      to: event.userEmail,
      subject: 'Order Created – TAJ Kulture',
      template: 'order-created',
      context: {
        orderId: event.orderId,
        totalAmount: event.totalAmount,
        itemsCount: event.items.length,
      },
    });

    // Send push notification
    await this.queueService.addNotificationJob(
      event.userId,
      'Order Placed!',
      `Your order #${event.orderId.slice(-6)} has been created. Complete payment to confirm.`,
    );
  }
}