import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  ConflictException,
  Inject,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import * as bcrypt from 'bcrypt';
import { RedisService } from '@/shared/infrastructure/redis/redis.service';
import { UserRegisteredEvent } from '../domain/events/user-registered.event';
import { RegisterDto } from './dto/register.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { AuthRepository } from '../domain/auth.repository.interface';

@Injectable()
export class AuthService {
  constructor(
    @Inject('AuthRepository') private authRepository: AuthRepository,
    private redis: RedisService,
    private jwtService: JwtService,
    private config: ConfigService,
    private eventEmitter: EventEmitter2,
  ) {}

  async requestOtp(phone: string) {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await this.redis.set(`otp:${phone}`, otp, 300); // 5 minutes
    // TODO: Send via Termii SMS
    console.log(`OTP for ${phone}: ${otp}`);
    return { message: 'OTP sent' };
  }

  async verifyOtp(dto: VerifyOtpDto) {
    const stored = await this.redis.get(`otp:${dto.phone}`);
    if (!stored || stored !== dto.otp) {
      throw new BadRequestException('Invalid or expired OTP');
    }
    await this.redis.del(`otp:${dto.phone}`);

    let user = await this.authRepository.findByPhone(dto.phone);
    if (!user) {
      // New user: must provide email and fullName
      if (!dto.email || !dto.fullName) {
        throw new BadRequestException(
          'New users must provide email and full name',
        );
      }
      const existingEmail = await this.authRepository.findByEmail(dto.email);
      if (existingEmail)
        throw new ConflictException('Email already registered');
      user = await this.authRepository.create(
        dto.phone,
        dto.email,
        dto.fullName,
      );
      // Emit domain event for new registration
      this.eventEmitter.emit(
        'auth.user.registered',
        new UserRegisteredEvent(user.id, user.email, user.phone, user.fullName),
      );
    } else {
      // Existing user – ensure phone is verified
      if (!user.isPhoneVerified) {
        user = await this.authRepository.update(user.id, {
          isPhoneVerified: true,
        });
      }
    }

    const tokens = await this.generateTokens(user.id);
    return { user, ...tokens };
  }

  async register(dto: RegisterDto) {
    // Alternative registration without OTP (if needed)
    const existing = await this.authRepository.findFirst(dto.email, dto.phone);
    if (existing) throw new ConflictException('User already exists');
    const user = await this.authRepository.create(
      dto.phone,
      dto.email,
      dto.fullName,
    );
    this.eventEmitter.emit(
      'auth.user.registered',
      new UserRegisteredEvent(user.id, user.email, user.phone, user.fullName),
    );
    const tokens = await this.generateTokens(user.id);
    return { user, ...tokens };
  }

  private async generateTokens(userId: string) {
    const accessToken = this.jwtService.sign(
      { sub: userId },
      {
        secret: this.config.get('jwt.secret'),
        expiresIn: this.config.get('jwt.expiresIn'),
      },
    );
    const refreshToken = this.jwtService.sign(
      { sub: userId },
      {
        secret: this.config.get('jwt.refreshSecret'),
        expiresIn: this.config.get('jwt.refreshExpiresIn'),
      },
    );
    const hashed = await bcrypt.hash(refreshToken, 10);
    await this.authRepository.update(userId, { refreshTokenHash: hashed });
    return { accessToken, refreshToken };
  }

  async refreshTokens(refreshToken: string) {
    let payload: any;
    try {
      payload = this.jwtService.verify(refreshToken, {
        secret: this.config.get('jwt.refreshSecret'),
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
    const user = await this.authRepository.findById(payload.sub);
    if (!user || !user.refreshTokenHash)
      throw new UnauthorizedException('No session');
    const isValid = await bcrypt.compare(refreshToken, user.refreshTokenHash);
    if (!isValid) throw new UnauthorizedException('Invalid refresh token');
    return this.generateTokens(user.id);
  }

  async logout(userId: string) {
    await this.authRepository.update(userId, { refreshTokenHash: null });
    return { message: 'Logged out' };
  }
}
