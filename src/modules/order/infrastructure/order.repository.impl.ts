import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/shared/infrastructure/database/prisma.service';
import { OrderRepository } from '../domain/order.repository.interface';
import { Order } from 'prisma-client';

@Injectable()
export class PrismaOrderRepository implements OrderRepository {
  constructor(private prisma: PrismaService) {}

  async createOrder(
    userId: string,
    items: Array<{
      variantId: string;
      quantity: number;
      priceAtPurchase: number;
    }>,
    totalAmount: number,
    discountAmount: number,
    shippingAddress: any,
  ): Promise<Order> {
    const orderNumber = `TAJ-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    return this.prisma.order.create({
      data: {
        userId,
        orderNumber,
        totalAmount,
        discountAmount,
        shippingAddress,
        status: 'pending',
        paymentStatus: 'unpaid',
        items: {
          create: items.map((item) => ({
            productVariantId: item.variantId,
            quantity: item.quantity,
            priceAtPurchase: item.priceAtPurchase,
          })),
        },
      },
    });
  }

  async findById(orderId: string): Promise<Order | null> {
    return this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });
  }

  async updateStatus(
    orderId: string,
    status: string,
    paymentStatus: string,
  ): Promise<Order> {
    return this.prisma.order.update({
      where: { id: orderId },
      data: { status, paymentStatus },
    });
  }
}
