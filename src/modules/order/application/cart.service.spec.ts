import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { CartService } from './cart.service';
import { PrismaService } from '../../../shared/infrastructure/database/prisma.service';

describe('CartService', () => {
  let service: CartService;
  let mockCartRepo: any;
  let mockPrisma: any;

  beforeEach(async () => {
    mockCartRepo = {
      getCart: jest.fn(),
      addItem: jest.fn(),
      removeItem: jest.fn(),
      clearCart: jest.fn(),
    };
    mockPrisma = {
      productVariant: {
        findUnique: jest.fn(),
      },
      product: {
        findUnique: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CartService,
        { provide: 'CartRepository', useValue: mockCartRepo }, // token matches @Inject('CartRepository')
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<CartService>(CartService);
  });

  describe('addToCart', () => {
    it('should add item to cart', async () => {
      const variant = {
        id: 'v1',
        productId: 'p1',
        stockQuantity: 10,
        additionalPrice: 1000,
      };
      const product = { id: 'p1', basePrice: 5000 };
      mockPrisma.productVariant.findUnique.mockResolvedValue(variant);
      mockPrisma.product.findUnique.mockResolvedValue(product);

      const result = await service.addToCart('user1', {
        variantId: 'v1',
        quantity: 2,
      });
      expect(result).toEqual({ message: 'Added to cart' });
      expect(mockCartRepo.addItem).toHaveBeenCalledWith('user1', 'v1', 2, 6000);
    });

    it('should throw NotFoundException if variant not found', async () => {
      mockPrisma.productVariant.findUnique.mockResolvedValue(null);
      await expect(
        service.addToCart('user1', { variantId: 'v1', quantity: 1 }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw Error if insufficient stock', async () => {
      const variant = {
        id: 'v1',
        productId: 'p1',
        stockQuantity: 1,
        additionalPrice: 1000,
      };
      mockPrisma.productVariant.findUnique.mockResolvedValue(variant);
      await expect(
        service.addToCart('user1', { variantId: 'v1', quantity: 2 }),
      ).rejects.toThrow('Insufficient stock');
    });
  });

  describe('getCart', () => {
    it('should return enriched cart items', async () => {
      const cartItems = [
        { variantId: 'v1', quantity: 2, price: 5000 },
        { variantId: 'v2', quantity: 1, price: 7000 },
      ];
      const variant1 = {
        id: 'v1',
        size: 'M',
        color: 'Black',
        product: { name: 'T-Shirt', basePrice: 4000 },
      };
      const variant2 = {
        id: 'v2',
        size: 'L',
        color: 'White',
        product: { name: 'Hoodie', basePrice: 6000 },
      };
      mockCartRepo.getCart.mockResolvedValue(cartItems);
      mockPrisma.productVariant.findUnique
        .mockResolvedValueOnce(variant1)
        .mockResolvedValueOnce(variant2);

      const result = await service.getCart('user1');
      expect(result).toEqual([
        {
          variantId: 'v1',
          productName: 'T-Shirt',
          size: 'M',
          color: 'Black',
          quantity: 2,
          price: 5000,
          total: 10000,
        },
        {
          variantId: 'v2',
          productName: 'Hoodie',
          size: 'L',
          color: 'White',
          quantity: 1,
          price: 7000,
          total: 7000,
        },
      ]);
    });

    it('should filter out null items when variant missing', async () => {
      const cartItems = [{ variantId: 'v1', quantity: 1, price: 5000 }];
      mockCartRepo.getCart.mockResolvedValue(cartItems);
      mockPrisma.productVariant.findUnique.mockResolvedValue(null);
      const result = await service.getCart('user1');
      expect(result).toEqual([]);
    });
  });

  describe('removeFromCart', () => {
    it('should remove item from cart', async () => {
      const result = await service.removeFromCart('user1', 'v1');
      expect(result).toEqual({ message: 'Removed from cart' });
      expect(mockCartRepo.removeItem).toHaveBeenCalledWith('user1', 'v1');
    });
  });

  describe('clearCart', () => {
    it('should clear the cart', async () => {
      await service.clearCart('user1');
      expect(mockCartRepo.clearCart).toHaveBeenCalledWith('user1');
    });
  });
});
