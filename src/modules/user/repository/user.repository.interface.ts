import { User } from 'prisma-client';

export interface UserRepository {
  findById(id: string): Promise<User | null>;
  findByReferralCode(code: string): Promise<User | null>;
  updateSabiScore(userId: string, newScore: number): Promise<User>;
  updateProfile(userId: string, data: Partial<User>): Promise<User>;
  createReferral(referrerId: string, referredId: string): Promise<void>;
}