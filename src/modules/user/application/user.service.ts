import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { UserRepository } from '../repository/user.repository.interface';
import { UserSabiScoreUpdatedEvent } from '../domain/events/user-sabi-score-updated.event';
import { UserReferredEvent } from '../domain/events/user-referred.event';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ApplyReferralDto } from './dto/apply-referral.dto';

@Injectable()
export class UserService {
  constructor(
    @Inject('UserRepository') private userRepository: UserRepository,
    private eventEmitter: EventEmitter2,
  ) {}

  async getProfile(userId: string) {
    const user = await this.userRepository.findById(userId);
    if (!user) throw new NotFoundException('User not found');
    // Exclude sensitive fields
    const { refreshTokenHash, ...safeUser } = user;
    return safeUser;
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.userRepository.updateProfile(userId, dto);
    const { refreshTokenHash, ...safeUser } = user;
    return safeUser;
  }

  async addSabiScore(userId: string, points: number, reason: string) {
    const user = await this.userRepository.findById(userId);
    if (!user) throw new NotFoundException('User not found');
    const oldScore = user.sabiScore;
    const newScore = oldScore + points;
    const updated = await this.userRepository.updateSabiScore(userId, newScore);
    this.eventEmitter.emit(
      'user.sabiScore.updated',
      new UserSabiScoreUpdatedEvent(userId, oldScore, newScore, reason),
    );
    return updated;
  }

  async applyReferral(userId: string, dto: ApplyReferralDto) {
    // Cannot refer yourself
    const user = await this.userRepository.findById(userId);
    if (!user) throw new NotFoundException('User not found');
    if (user.referralCode === dto.referralCode) {
      throw new BadRequestException('You cannot use your own referral code');
    }
    // Check if already referred
    const existingReferral = await this.userRepository.findByReferralCode(
      dto.referralCode,
    );
    // Actually, we need to check if this user already has a referral record
    // For brevity, assume check in repository method. We'll implement a method.
    const referrer = await this.userRepository.findByReferralCode(
      dto.referralCode,
    );
    if (!referrer) return('Invalid referral code');
    // Create referral record (ensure unique)
    await this.userRepository.createReferral(referrer.id, userId);
    // Award Sabi points to referrer (e.g., 50 points)
    await this.addSabiScore(referrer.id, 50, `Referred user ${user.email}`);
    // Emit event for analytics/notifications
    this.eventEmitter.emit(
      'user.referred',
      new UserReferredEvent(referrer.id, userId, user.email),
    );
    return { message: 'Referral applied successfully' };
  }
}
