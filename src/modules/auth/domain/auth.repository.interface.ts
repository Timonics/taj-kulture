import { User } from 'prisma-client';

export interface AuthRepository {
  findById(id: string): Promise<User | null>;
  findByPhone(phone: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findFirst(email: string, phone: string): Promise<User | null>;
  create(
    phone: string,
    email: string,
    fullName: string,
    referralCode?: string,
  ): Promise<User>;
  update(userId: string, data: Partial<User>): Promise<User>;
}
