import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/infrastructure/database/prisma.service';
import { ReviewRepository } from '../domain/review.repository.interface';
import { Review } from 'prisma-client';

@Injectable()
export class PrismaReviewRepository implements ReviewRepository {
  constructor(private prisma: PrismaService) {}

  async create(data: any): Promise<Review> {
    return this.prisma.review.create({ data });
  }

  async findByProduct(
    productId: string,
    page: number,
    limit: number,
  ): Promise<Review[]> {
    const skip = (page - 1) * limit;
    return this.prisma.review.findMany({
      where: { productId },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { fullName: true, avatarUrl: true } } },
    });
  }

  async countByProduct(productId: string): Promise<number> {
    return this.prisma.review.count({ where: { productId } });
  }

  async findByUser(
    userId: string,
    page: number,
    limit: number,
  ): Promise<Review[]> {
    const skip = (page - 1) * limit;
    return this.prisma.review.findMany({
      where: { userId },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string): Promise<Review | null> {
    return this.prisma.review.findUnique({ where: { id } });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.review.delete({ where: { id } });
  }

  async updateVerifiedPurchase(reviewId: string): Promise<Review> {
    return this.prisma.review.update({
      where: { id: reviewId },
      data: { isVerifiedPurchase: true },
    });
  }
}
