import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/shared/infrastructure/database/prisma.service';
import { UserRepository } from './user.repository.interface';
import { User } from 'prisma-client';

@Injectable()
export class PrismaUserRepository implements UserRepository {
  constructor(private prisma: PrismaService) {}

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async findByReferralCode(code: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { referralCode: code } });
  }

  async updateSabiScore(userId: string, newScore: number): Promise<User> {
    return this.prisma.user.update({
      where: { id: userId },
      data: { sabiScore: newScore },
    });
  }

  async updateProfile(userId: string, data: Partial<User>): Promise<User> {
    return this.prisma.user.update({
      where: { id: userId },
      data,
    });
  }

  async createReferral(referrerId: string, referredId: string): Promise<void> {
    await this.prisma.referral.create({
      data: {
        referrerId,
        referredId,
        rewardStatus: 'pending',
      },
    });
  }
}