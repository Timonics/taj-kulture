import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Processor('inventory')
export class InventoryProcessor {
  private readonly logger = new Logger(InventoryProcessor.name);

  constructor(private prisma: PrismaService) {}

  @Process('deduct')
  async handleDeduct(job: Job) {
    const { orderId } = job.data;
    this.logger.log(`Processing inventory deduction for order ${orderId}`);

    // Fetch order items
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order) {
      throw new Error(`Order ${orderId} not found`);
    }

    // Deduct stock for each item using transaction to ensure consistency
    await this.prisma.$transaction(async (tx) => {
      for (const item of order.items) {
        const variant = await tx.productVariant.findUnique({
          where: { id: item.productVariantId },
        });
        if (!variant) {
          throw new Error(`Variant ${item.productVariantId} not found`);
        }
        if (variant.stockQuantity < item.quantity) {
          throw new Error(
            `Insufficient stock for variant ${item.productVariantId}`,
          );
        }
        await tx.productVariant.update({
          where: { id: item.productVariantId },
          data: { stockQuantity: { decrement: item.quantity } },
        });
      }
    });

    this.logger.log(`Inventory deducted for order ${orderId}`);
    return { success: true };
  }
}
