import { Review } from 'prisma-client';

export interface ReviewRepository {
  create(data: any): Promise<Review>;
  findByProduct(
    productId: string,
    page: number,
    limit: number,
  ): Promise<Review[]>;
  countByProduct(productId: string): Promise<number>;
  findByUser(userId: string, page: number, limit: number): Promise<Review[]>;
  findById(id: string): Promise<Review | null>;
  delete(id: string): Promise<void>;
  updateVerifiedPurchase(reviewId: string): Promise<Review>;
}
