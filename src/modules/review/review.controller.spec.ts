import { Test, TestingModule } from '@nestjs/testing';
import { ReviewController } from './review.controller';
import { ReviewService } from './application/review.service';
import { CreateReviewDto } from './application/dto/create-review.dto';
import { ReviewQueryDto } from './application/dto/review-query.dto';

describe('ReviewController', () => {
  let controller: ReviewController;
  let mockReviewService: jest.Mocked<ReviewService>;

  beforeEach(async () => {
    mockReviewService = {
      createReview: jest.fn(),
      getProductReviews: jest.fn(),
      getUserReviews: jest.fn(),
      deleteReview: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReviewController],
      providers: [{ provide: ReviewService, useValue: mockReviewService }],
    }).compile();

    controller = module.get<ReviewController>(ReviewController);
  });

  describe('getProductReviews (public)', () => {
    it('should call service.getProductReviews with productId and query', async () => {
      const productId = 'prod1';
      const query: ReviewQueryDto = { page: 2, limit: 10 };
      const expected = { data: [], meta: {} };
      mockReviewService.getProductReviews.mockResolvedValue(expected as any);

      const result = await controller.getProductReviews(productId, query);

      expect(result).toEqual(expected);
      expect(mockReviewService.getProductReviews).toHaveBeenCalledWith(
        productId,
        query,
      );
    });

    it('should use default pagination when query is empty', async () => {
      const productId = 'prod1';
      const expected = { data: [], meta: {} };
      mockReviewService.getProductReviews.mockResolvedValue(expected as any);

      const result = await controller.getProductReviews(productId, {});

      expect(result).toEqual(expected);
      expect(mockReviewService.getProductReviews).toHaveBeenCalledWith(
        productId,
        {},
      );
    });
  });

  describe('createReview (authenticated)', () => {
    it('should call service.createReview with userId, productId, and dto', async () => {
      const req = { user: { id: 'user1' } };
      const productId = 'prod1';
      const dto: CreateReviewDto = {
        rating: 5,
        comment: 'Great!',
        audioUrl: null,
      };
      const expected = { id: 'review1', ...dto };
      mockReviewService.createReview.mockResolvedValue(expected as any);

      const result = await controller.createReview(req, productId, dto);

      expect(result).toEqual(expected);
      expect(mockReviewService.createReview).toHaveBeenCalledWith(
        'user1',
        productId,
        dto,
      );
    });
  });

  describe('getMyReviews (authenticated)', () => {
    it('should call service.getUserReviews with userId and query', async () => {
      const req = { user: { id: 'user1' } };
      const query: ReviewQueryDto = { page: 1, limit: 5 };
      const expected = [{ id: 'review1' }];
      mockReviewService.getUserReviews.mockResolvedValue(expected as any);

      const result = await controller.getMyReviews(req, query);

      expect(result).toEqual(expected);
      expect(mockReviewService.getUserReviews).toHaveBeenCalledWith(
        'user1',
        query,
      );
    });

    it('should use default pagination when query not provided', async () => {
      const req = { user: { id: 'user1' } };
      await controller.getMyReviews(req, {});
      expect(mockReviewService.getUserReviews).toHaveBeenCalledWith(
        'user1',
        {},
      );
    });
  });

  describe('deleteReview (authenticated – own review)', () => {
    it('should call service.deleteReview with userId, reviewId, and isAdmin=false', async () => {
      const req = { user: { id: 'user1' } };
      const reviewId = 'review1';
      const expected = { message: 'Review deleted' };
      mockReviewService.deleteReview.mockResolvedValue(expected as any);

      const result = await controller.deleteReview(req, reviewId);

      expect(result).toEqual(expected);
      expect(mockReviewService.deleteReview).toHaveBeenCalledWith(
        'user1',
        reviewId,
        false,
      );
    });
  });

  describe('adminDeleteReview (admin)', () => {
    it('should call service.deleteReview with empty userId, reviewId, and isAdmin=true', async () => {
      const reviewId = 'review1';
      const expected = { message: 'Review deleted' };
      mockReviewService.deleteReview.mockResolvedValue(expected as any);

      const result = await controller.adminDeleteReview(reviewId);

      expect(result).toEqual(expected);
      expect(mockReviewService.deleteReview).toHaveBeenCalledWith(
        '',
        reviewId,
        true,
      );
    });
  });
});
