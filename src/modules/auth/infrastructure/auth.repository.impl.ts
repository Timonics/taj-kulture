import { User } from 'prisma-client';
import { AuthRepository } from '../domain/auth.repository.interface';
import { PrismaService } from '@/shared/infrastructure/database/prisma.service';

export class PrismaAuthRepository implements AuthRepository {
  constructor(private prisma: PrismaService) {}

  findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: {
        id,
      },
    });
  }

  findByPhone(phone: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: {
        phone,
      },
    });
  }

  findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: {
        email,
      },
    });
  }

  findFirst(email: string, phone: string): Promise<User | null> {
    return this.prisma.user.findFirst({
      where: { OR: [{ email }, { phone }] },
    });
  }

  create(
    phone: string,
    email: string,
    fullName: string,
    referralCode: string = `TAJ${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
  ): Promise<User> {
    return this.prisma.user.create({
      data: {
        phone,
        email,
        fullName,
        referralCode,
        isPhoneVerified: true,
      },
    });
  }

  update(userId: string, data: Partial<User>): Promise<User> {
    return this.prisma.user.update({
      where: { id: userId },
      data,
    });
  }
}
