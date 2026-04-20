import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ReviewService } from './review.service';
import { ReviewRepository } from '../domain/review.repository.interface';
import { PrismaService } from '../../../shared/infrastructure/database/prisma.service';

describe('ReviewService', () => {
  let service: ReviewService;
  let mockRepo: jest.Mocked<ReviewRepository>;
  let mockPrisma: any;
  let mockEventEmitter: jest.Mocked<EventEmitter2>;

  beforeEach(async () => {
    mockRepo = {
      create: jest.fn(),
      findByProduct: jest.fn(),
      countByProduct: jest.fn(),
      findByUser: jest.fn(),
      findById: jest.fn(),
      delete: jest.fn(),
      updateVerifiedPurchase: jest.fn(),
    };
    mockEventEmitter = { emit: jest.fn() } as any;
    mockPrisma = {
      product: { findUnique: jest.fn() },
      order: { findFirst: jest.fn() },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReviewService,
        { provide: 'ReviewRepository', useValue: mockRepo },
        { provide: EventEmitter2, useValue: mockEventEmitter },
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<ReviewService>(ReviewService);
  });

  describe('createReview', () => {
    const userId = 'user1';
    const productId = 'prod1';
    const dto = {
      rating: 5,
      comment: 'Great!',
      audioUrl: null,
      userId,
      productId,
      createdAt: new Date(),
    };

    it('should create review with verified purchase if user bought product', async () => {
      mockPrisma.product.findUnique.mockResolvedValue({ id: productId });
      mockPrisma.order.findFirst.mockResolvedValue({ id: 'order1' });
      mockRepo.create.mockResolvedValue({
        id: 'review1',
        ...dto,
        isVerifiedPurchase: true,
      });

      const result = await service.createReview(userId, productId, dto);
      expect(result.isVerifiedPurchase).toBe(true);
      expect(mockEventEmitter.emit).toHaveBeenCalled();
    });

    it('should throw if product not found', async () => {
      mockPrisma.product.findUnique.mockResolvedValue(null);
      await expect(
        service.createReview(userId, productId, dto),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw if no comment and no audioUrl', async () => {
      await expect(
        service.createReview(userId, productId, { rating: 5 } as any),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getProductReviews', () => {
    it('should return paginated reviews', async () => {
      //@ts-ignore
      mockRepo.findByProduct.mockResolvedValue([{ id: 'r1' }]);
      mockRepo.countByProduct.mockResolvedValue(1);
      const result = await service.getProductReviews('prod1', {
        page: 1,
        limit: 10,
      });
      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });
  });

  describe('deleteReview', () => {
    it('should allow user to delete own review', async () => {
      //@ts-ignore
      mockRepo.findById.mockResolvedValue({ id: 'r1', userId: 'user1' });
      mockRepo.delete.mockResolvedValue(undefined);
      const result = await service.deleteReview('user1', 'r1', false);
      expect(result).toEqual({ message: 'Review deleted' });
    });

    it('should allow admin to delete any review', async () => {
      //@ts-ignore
      mockRepo.findById.mockResolvedValue({ id: 'r1', userId: 'other' });
      mockRepo.delete.mockResolvedValue(undefined);
      const result = await service.deleteReview('admin', 'r1', true);
      expect(result).toEqual({ message: 'Review deleted' });
    });

    it('should throw if review not found', async () => {
      mockRepo.findById.mockResolvedValue(null);
      await expect(
        service.deleteReview('user1', 'invalid', false),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
