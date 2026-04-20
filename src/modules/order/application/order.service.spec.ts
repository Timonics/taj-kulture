import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  NotFoundException,
  HttpException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { OrderService } from './order.service';
import { PaystackService } from '../infrastructure/paystack.service';
import { PrismaService } from '../../../shared/infrastructure/database/prisma.service';
import { OrderRepository } from '../domain/order.repository.interface';
import { CartRepository } from '../domain/cart.repository.interface';
import { ConfigService } from '@nestjs/config';

describe('OrderService', () => {
  let service: OrderService;
  let mockOrderRepo: jest.Mocked<OrderRepository>;
  let mockCartRepo: jest.Mocked<CartRepository>;
  let mockUserRepo: any;
  let mockEventEmitter: jest.Mocked<EventEmitter2>;
  let mockPaystack: jest.Mocked<PaystackService>;
  let mockConfig: jest.Mocked<ConfigService>;
  let mockPrisma: any;

  beforeEach(async () => {
    mockOrderRepo = {
      createOrder: jest.fn(),
      findById: jest.fn(),
      updateStatus: jest.fn(),
    } as any;

    mockCartRepo = {
      getCart: jest.fn(),
      addItem: jest.fn(),
      removeItem: jest.fn(),
      updateQuantity: jest.fn(),
      clearCart: jest.fn(),
    } as any;

    mockUserRepo = {
      findById: jest.fn(),
    } as any;

    mockEventEmitter = { emit: jest.fn() } as any;
    mockPaystack = {
      initializeTransaction: jest.fn(),
      verifyWebhookSignature: jest.fn(),
    } as any;
    mockConfig = {
      get: jest.fn().mockReturnValue('https://callback.url'),
    } as any;

    mockPrisma = {
      productVariant: {
        findUnique: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderService,
        { provide: 'OrderRepository', useValue: mockOrderRepo },
        { provide: 'CartRepository', useValue: mockCartRepo },
        { provide: 'UserRepository', useValue: mockUserRepo },
        { provide: EventEmitter2, useValue: mockEventEmitter },
        { provide: PaystackService, useValue: mockPaystack },
        { provide: ConfigService, useValue: mockConfig },
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<OrderService>(OrderService);
  });

  describe('checkout', () => {
    const userId = 'user123';
    const checkoutDto = {
      shippingAddress: {
        street: '123 Main St',
        city: 'Lagos',
        state: 'LA',
        zipCode: '100001',
        phone: '+2348012345678',
      },
    };

    it('should successfully create order and return payment URL', async () => {
      const cartItems = [
        { variantId: 'v1', quantity: 2, price: 5000 },
        { variantId: 'v2', quantity: 1, price: 7000 },
      ];
      const user = {
        id: userId,
        email: 'test@example.com',
        fullName: 'Test User',
      };
      const order = {
        id: 'order123',
        userId,
        totalAmount: 17000,
        discountAmount: 0,
      };
      const paymentUrl = 'https://paystack.com/pay/abc123';

      mockCartRepo.getCart.mockResolvedValue(cartItems);
      // Use mockResolvedValue on the jest mock function
      (mockPrisma.productVariant.findUnique as jest.Mock)
        .mockResolvedValueOnce({ id: 'v1', stockQuantity: 10 })
        .mockResolvedValueOnce({ id: 'v2', stockQuantity: 5 });
      mockOrderRepo.createOrder.mockResolvedValue(order as any);
      mockUserRepo.findById.mockResolvedValue(user);
      mockPaystack.initializeTransaction.mockResolvedValue(paymentUrl);

      const result = await service.checkout(userId, checkoutDto as any);

      expect(result).toEqual({ orderId: 'order123', paymentUrl });
      expect(mockOrderRepo.createOrder).toHaveBeenCalled();
      expect(mockEventEmitter.emit).toHaveBeenCalled();
    });

    it('should throw BadRequestException if cart is empty', async () => {
      mockCartRepo.getCart.mockResolvedValue([]);
      await expect(
        service.checkout(userId, checkoutDto as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if any variant is out of stock', async () => {
      const cartItems = [{ variantId: 'v1', quantity: 10, price: 5000 }];
      mockCartRepo.getCart.mockResolvedValue(cartItems);
      (mockPrisma.productVariant.findUnique as jest.Mock).mockResolvedValue({
        id: 'v1',
        stockQuantity: 5,
      });
      await expect(
        service.checkout(userId, checkoutDto as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if user not found', async () => {
      const cartItems = [{ variantId: 'v1', quantity: 1, price: 5000 }];
      mockCartRepo.getCart.mockResolvedValue(cartItems);
      (mockPrisma.productVariant.findUnique as jest.Mock).mockResolvedValue({
        id: 'v1',
        stockQuantity: 10,
      });
      mockOrderRepo.createOrder.mockResolvedValue({
        id: 'order123',
        userId,
      } as any);
      mockUserRepo.findById.mockResolvedValue(null);
      await expect(
        service.checkout(userId, checkoutDto as any),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('handlePaystackWebhook', () => {
    const validPayload = {
      event: 'charge.success',
      data: {
        metadata: { orderId: 'order123' },
        status: 'success',
        amount: 1700000,
      },
    };
    const signature = 'valid_signature';

    it('should update order status and emit event on successful payment', async () => {
      const order = {
        id: 'order123',
        userId: 'user123',
        paymentStatus: 'unpaid',
        totalAmount: 17000,
      };
      const user = { id: 'user123', email: 'user@example.com' };

      mockPaystack.verifyWebhookSignature.mockReturnValue(true);
      mockOrderRepo.findById.mockResolvedValue(order as any);
      mockOrderRepo.updateStatus.mockResolvedValue({} as any);
      mockUserRepo.findById.mockResolvedValue(user);
      mockCartRepo.clearCart.mockResolvedValue(undefined);

      const result = await service.handlePaystackWebhook(
        validPayload,
        signature,
      );
      expect(result).toEqual({ received: true });
      expect(mockOrderRepo.updateStatus).toHaveBeenCalledWith(
        'order123',
        'paid',
        'paid',
      );
      expect(mockEventEmitter.emit).toHaveBeenCalled();
      expect(mockCartRepo.clearCart).toHaveBeenCalledWith('user123');
    });

    it('should throw HttpException if signature invalid', async () => {
      mockPaystack.verifyWebhookSignature.mockReturnValue(false);
      await expect(
        service.handlePaystackWebhook(validPayload, 'bad'),
      ).rejects.toThrow(HttpException);
    });

    it('should throw BadRequestException if orderId missing', async () => {
      const noOrderId = { event: 'charge.success', data: { metadata: {} } };
      mockPaystack.verifyWebhookSignature.mockReturnValue(true);
      await expect(
        service.handlePaystackWebhook(noOrderId, signature),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
