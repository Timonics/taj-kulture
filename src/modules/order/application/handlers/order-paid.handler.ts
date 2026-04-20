import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { QueueService } from '../../../../shared/infrastructure/queue/queue.service';
import { OrderPaidEvent } from '../../domain/events/order-paid.event';

@Injectable()
export class OrderPaidHandler {
  constructor(private queueService: QueueService) {}

  @OnEvent('order.paid')
  async handle(event: OrderPaidEvent) {
    // Deduct inventory (queue job)
    await this.queueService.addInventoryJob(event.orderId);
    // Add Sabi score (e.g., 20 points per order)
    await this.queueService.addSabiScoreJob(
      event.userId,
      20,
      `Order #${event.orderId}`,
    );
    // Send order confirmation email
    await this.queueService.addEmailJob({
      to: event.userEmail,
      subject: 'Payment Confirmed – TAJ Kulture',
      template: 'order-paid',
      context: { orderId: event.orderId, total: event.totalAmount },
    });
  }
}
