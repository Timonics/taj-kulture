import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { QueueService } from '@/shared/infrastructure/queue/queue.service';
import { LowStockEvent } from '../../domain/events/low-stock.event';

@Injectable()
export class LowStockHandler {
  constructor(private queueService: QueueService) {}

  @OnEvent('product.lowStock')
  async handle(event: LowStockEvent) {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@tajkulture.com';

    await this.queueService.addEmailJob({
      to: adminEmail,
      subject: 'Low Stock Alert',
      template: 'low-stock',
      context: {
        variantId: event.variantId,
        productId: event.productId,
        currentStock: event.currentStock,
      },
    });

    // Optionally send push notification to inventory managers
    await this.queueService.addNotificationJob(
      'admin', // could be a specific admin user ID
      'Low Stock Alert',
      `Product variant ${event.variantId} has only ${event.currentStock} left.`,
    );
  }
}
