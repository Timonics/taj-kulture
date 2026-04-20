import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ReviewRepository } from '../domain/review.repository.interface';
import { CreateReviewDto } from './dto/create-review.dto';
import { ReviewQueryDto } from './dto/review-query.dto';
import { ReviewCreatedEvent } from '../domain/events/review-created.event';
import { PrismaService } from '../../../shared/infrastructure/database/prisma.service';
import { CloudinaryService } from '@/shared/infrastructure/cloudinary/cloudinary.service';
import { extractPublicId } from '@/shared/utils/cloudinary.util';

@Injectable()
export class ReviewService {
  constructor(
    @Inject('ReviewRepository') private reviewRepository: ReviewRepository,
    private cloudinaryService: CloudinaryService,
    private eventEmitter: EventEmitter2,
    private prisma: PrismaService,
  ) {}

  async createReview(userId: string, productId: string, dto: CreateReviewDto) {
    // Validate at least one of comment or audioUrl
    if (!dto.comment && !dto.audioUrl) {
      throw new BadRequestException(
        'Either comment or audioUrl must be provided',
      );
    }

    // Check if product exists
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });
    if (!product) throw new NotFoundException('Product not found');

    // Check if user has purchased this product (for verified badge)
    const hasPurchased = await this.hasUserPurchasedProduct(userId, productId);

    const review = await this.reviewRepository.create({
      userId,
      productId,
      rating: dto.rating,
      comment: dto.comment,
      audioUrl: dto.audioUrl,
      isVerifiedPurchase: hasPurchased,
    });

    // Emit event for analytics/notifications
    this.eventEmitter.emit(
      'review.created',
      new ReviewCreatedEvent(
        review.id,
        userId,
        productId,
        dto.rating,
        !!dto.audioUrl,
        !!dto.comment,
      ),
    );

    return review;
  }

  private async hasUserPurchasedProduct(
    userId: string,
    productId: string,
  ): Promise<boolean> {
    // Check if user has any order with paid status containing this product
    const order = await this.prisma.order.findFirst({
      where: {
        userId,
        paymentStatus: 'paid',
        items: {
          some: {
            productVariant: {
              productId,
            },
          },
        },
      },
    });
    return !!order;
  }

  async getProductReviews(productId: string, query: ReviewQueryDto) {
    const { page, limit } = query;
    const [reviews, total] = await Promise.all([
      this.reviewRepository.findByProduct(productId, page!, limit!),
      this.reviewRepository.countByProduct(productId),
    ]);
    return {
      data: reviews,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit!) },
    };
  }

  async getUserReviews(userId: string, query: ReviewQueryDto) {
    const { page, limit } = query;
    return this.reviewRepository.findByUser(userId, page!, limit!);
  }

  async deleteReview(userId: string, reviewId: string, isAdmin = false) {
    const review = await this.reviewRepository.findById(reviewId);
    if (!review) throw new NotFoundException('Review not found');
    if (review.userId !== userId && !isAdmin) {
      throw new BadRequestException('You can only delete your own reviews');
    }

    // Delete audio from Cloudinary if exists
    if (review.audioUrl) {
      // Extract publicId from URL (you need a helper)
      const publicId = extractPublicId(review.audioUrl);
      await this.cloudinaryService.deleteFile(publicId);
    }

    await this.reviewRepository.delete(reviewId);
    return { message: 'Review deleted' };
  }
}
