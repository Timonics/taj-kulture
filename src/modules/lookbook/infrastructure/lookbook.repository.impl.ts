import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/infrastructure/database/prisma.service';
import { LookbookRepository } from '../domain/lookbook.repository.interface';
import { LookbookPost } from 'prisma-client';

@Injectable()
export class PrismaLookbookRepository implements LookbookRepository {
  constructor(private prisma: PrismaService) {}

  async create(data: any): Promise<LookbookPost> {
    return this.prisma.lookbookPost.create({ data });
  }

  async findById(id: string): Promise<LookbookPost | null> {
    return this.prisma.lookbookPost.findUnique({ where: { id } });
  }

  async findByUser(
    userId: string,
    page: number,
    limit: number,
  ): Promise<LookbookPost[]> {
    const skip = (page - 1) * limit;
    return this.prisma.lookbookPost.findMany({
      where: { userId },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findPending(page: number, limit: number): Promise<LookbookPost[]> {
    const skip = (page - 1) * limit;
    return this.prisma.lookbookPost.findMany({
      where: { status: 'pending' },
      skip,
      take: limit,
      orderBy: { createdAt: 'asc' },
    });
  }

  async findApproved(page: number, limit: number): Promise<LookbookPost[]> {
    const skip = (page - 1) * limit;
    return this.prisma.lookbookPost.findMany({
      where: { status: 'approved' },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateStatus(id: string, status: string): Promise<LookbookPost> {
    return this.prisma.lookbookPost.update({
      where: { id },
      data: { status },
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.lookbookPost.delete({ where: { id } });
  }

  async countByStatus(status: string): Promise<number> {
    return this.prisma.lookbookPost.count({ where: { status } });
  }
}
