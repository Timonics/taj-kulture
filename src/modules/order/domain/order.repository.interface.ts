import { Order, OrderItem } from 'prisma-client';

export interface OrderRepository {
  createOrder(
    userId: string,
    items: Array<{
      variantId: string;
      quantity: number;
      priceAtPurchase: number;
    }>,
    totalAmount: number,
    discountAmount: number,
    shippingAddress: any,
  ): Promise<Order>;
  findById(orderId: string): Promise<Order | null>;
  updateStatus(
    orderId: string,
    status: string,
    paymentStatus: string,
  ): Promise<Order>;
}
