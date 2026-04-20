import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ConfigService } from '@nestjs/config';
import { OrderRepository } from '../domain/order.repository.interface';
import { CartRepository } from '../domain/cart.repository.interface';
import { OrderCreatedEvent } from '../domain/events/order-created.event';
import { OrderPaidEvent } from '../domain/events/order-paid.event';
import { CheckoutDto } from './dto/checkout.dto';
import { PaystackService } from '../infrastructure/paystack.service';
import { PrismaService } from '@/shared/infrastructure/database/prisma.service';
import { UserRepository } from '@/modules/user/domain/user.repository.interface';

@Injectable()
export class OrderService {
  constructor(
    @Inject('OrderRepository') private orderRepository: OrderRepository,
    @Inject('CartRepository') private cartRepository: CartRepository,
    @Inject('UserRepository') private userRepository: UserRepository,
    private eventEmitter: EventEmitter2,
    private paystackService: PaystackService,
    private config: ConfigService,
    private prisma: PrismaService,
  ) {}

  async checkout(userId: string, dto: CheckoutDto) {
    // 1. Get cart items
    const cartItems = await this.cartRepository.getCart(userId);
    if (cartItems.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    // 2. Validate inventory availability (prevent overselling)
    await this.validateInventory(cartItems);

    // 3. Calculate totals
    const totalAmount = cartItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );
    const discountAmount = 0; // TODO: integrate promo code service later
    const finalAmount = totalAmount - discountAmount;

    // 4. Create order (status: pending)
    const order = await this.orderRepository.createOrder(
      userId,
      cartItems.map((item) => ({
        variantId: item.variantId,
        quantity: item.quantity,
        priceAtPurchase: item.price,
      })),
      finalAmount,
      discountAmount,
      dto.shippingAddress,
    );

    // 5. Get user email
    const user = await this.userRepository.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    // 6. Emit order created event (async notifications)
    this.eventEmitter.emit(
      'order.created',
      new OrderCreatedEvent(
        order.id,
        userId,
        user.email,
        finalAmount,
        cartItems,
      ),
    );

    // 7. Initialize Paystack payment
    const callbackUrl = this.config.get('paystack.callbackUrl');
    const paymentUrl = await this.paystackService.initializeTransaction(
      order.id,
      finalAmount,
      user.email,
      callbackUrl,
    );

    return { orderId: order.id, paymentUrl };
  }

  private async validateInventory(cartItems: any[]) {
    for (const item of cartItems) {
      const variant = await this.prisma.productVariant.findUnique({
        where: { id: item.variantId },
      });
      if (!variant)
        throw new BadRequestException(`Variant ${item.variantId} not found`);
      if (variant.stockQuantity < item.quantity) {
        throw new BadRequestException(
          `Insufficient stock for variant ${item.variantId}`,
        );
      }
    }
  }

  async handlePaystackWebhook(payload: any, signature: string) {
    // Verify signature
    if (!this.paystackService.verifyWebhookSignature(payload, signature)) {
      throw new HttpException('Invalid signature', HttpStatus.UNAUTHORIZED);
    }

    const { event, data } = payload;
    if (event !== 'charge.success') {
      return { received: true };
    }

    const orderId = data.metadata?.orderId;
    if (!orderId) throw new BadRequestException('No orderId in metadata');

    const order = await this.orderRepository.findById(orderId);
    if (!order) throw new NotFoundException('Order not found');

    if (order.paymentStatus === 'paid') {
      return { received: true }; // already processed
    }

    // Update order status
    await this.orderRepository.updateStatus(orderId, 'paid', 'paid');

    // Get user email
    const user = await this.userRepository.findById(order.userId);
    if (!user) throw new NotFoundException('User not found');

    // Emit order paid event
    this.eventEmitter.emit(
      'order.paid',
      new OrderPaidEvent(orderId, order.userId, user.email, order.totalAmount),
    );

    // Clear cart
    await this.cartRepository.clearCart(order.userId);

    return { received: true };
  }
}
