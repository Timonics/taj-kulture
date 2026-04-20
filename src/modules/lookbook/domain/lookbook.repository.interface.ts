import { LookbookPost } from 'prisma-client';

export interface LookbookRepository {
  create(data: any): Promise<LookbookPost>;
  findById(id: string): Promise<LookbookPost | null>;
  findByUser(
    userId: string,
    page: number,
    limit: number,
  ): Promise<LookbookPost[]>;
  findPending(page: number, limit: number): Promise<LookbookPost[]>;
  findApproved(page: number, limit: number): Promise<LookbookPost[]>;
  updateStatus(id: string, status: string): Promise<LookbookPost>;
  delete(id: string): Promise<void>;
  countByStatus(status: string): Promise<number>;
}
