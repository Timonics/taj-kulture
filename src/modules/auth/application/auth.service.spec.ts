import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { RedisService } from '../../../shared/infrastructure/redis/redis.service';
import { UserRegisteredEvent } from '../domain/events/user-registered.event';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { RegisterDto } from './dto/register.dto';

// Mock bcrypt
jest.mock('bcrypt');
const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

describe('AuthService', () => {
  let service: AuthService;
  let mockAuthRepo: any;
  let mockRedis: jest.Mocked<RedisService>;
  let mockJwtService: jest.Mocked<JwtService>;
  let mockConfig: jest.Mocked<ConfigService>;
  let mockEventEmitter: jest.Mocked<EventEmitter2>;

  beforeEach(async () => {
    mockAuthRepo = {
      findById: jest.fn(),
      findByPhone: jest.fn(),
      findByEmail: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    };

    mockRedis = {
      set: jest.fn(),
      get: jest.fn(),
      del: jest.fn(),
    } as any;

    mockJwtService = {
      sign: jest.fn(),
      verify: jest.fn(),
    } as any;

    mockConfig = {
      get: jest.fn(),
    } as any;

    mockEventEmitter = {
      emit: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: 'AuthRepository', useValue: mockAuthRepo },
        { provide: RedisService, useValue: mockRedis },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfig },
        { provide: EventEmitter2, useValue: mockEventEmitter },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('requestOtp', () => {
    it('should store OTP in Redis and return message', async () => {
      const phone = '+2348012345678';
      mockRedis.set.mockResolvedValue(undefined);
      const result = await service.requestOtp(phone);
      expect(result).toEqual({ message: 'OTP sent' });
      expect(mockRedis.set).toHaveBeenCalledWith(
        `otp:${phone}`,
        expect.any(String),
        300,
      );
    });
  });

  describe('verifyOtp', () => {
    const dto: VerifyOtpDto = {
      phone: '+2348012345678',
      otp: '123456',
      email: 'test@example.com',
      fullName: 'Test User',
    };

    it('should create new user and return tokens when OTP valid', async () => {
      mockRedis.get.mockResolvedValue('123456');
      mockAuthRepo.findByPhone.mockResolvedValue(null);
      mockAuthRepo.findByEmail.mockResolvedValue(null);
      const newUser = {
        id: 'user1',
        phone: dto.phone,
        email: dto.email,
        fullName: dto.fullName,
        isPhoneVerified: true,
      };
      mockAuthRepo.create.mockResolvedValue(newUser);
      mockJwtService.sign
        .mockReturnValueOnce('access_token')
        .mockReturnValueOnce('refresh_token');
      mockConfig.get.mockReturnValue('15m');
      mockedBcrypt.hash.mockResolvedValue('hashed' as never);
      mockAuthRepo.update.mockResolvedValue(newUser);

      const result = await service.verifyOtp(dto);
      expect(result).toHaveProperty('accessToken', 'access_token');
      expect(result).toHaveProperty('refreshToken', 'refresh_token');
      expect(result.user).toEqual(newUser);
      expect(mockAuthRepo.create).toHaveBeenCalledWith(
        dto.phone,
        dto.email,
        dto.fullName,
      );
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'auth.user.registered',
        expect.any(UserRegisteredEvent),
      );
      expect(mockAuthRepo.update).toHaveBeenCalledWith('user1', {
        refreshTokenHash: 'hashed',
      });
    });

    it('should login existing user and update phone verification', async () => {
      const existingUser = {
        id: 'user1',
        phone: dto.phone,
        email: 'old@example.com',
        isPhoneVerified: false,
      };
      mockRedis.get.mockResolvedValue('123456');
      mockAuthRepo.findByPhone.mockResolvedValue(existingUser);
      mockAuthRepo.update.mockResolvedValue({
        ...existingUser,
        isPhoneVerified: true,
      });
      mockJwtService.sign
        .mockReturnValueOnce('access_token')
        .mockReturnValueOnce('refresh_token');
      mockConfig.get.mockReturnValue('15m');
      mockedBcrypt.hash.mockResolvedValue('hashed' as never);

      const result = await service.verifyOtp(dto);
      expect(result.user.isPhoneVerified).toBe(true);
      expect(mockAuthRepo.create).not.toHaveBeenCalled();
      expect(mockAuthRepo.update).toHaveBeenCalledWith('user1', {
        isPhoneVerified: true,
      });
      expect(mockEventEmitter.emit).not.toHaveBeenCalled();
    });

    it('should throw if OTP invalid', async () => {
      mockRedis.get.mockResolvedValue('wrong');
      await expect(service.verifyOtp(dto)).rejects.toThrow(BadRequestException);
    });

    it('should throw if OTP expired', async () => {
      mockRedis.get.mockResolvedValue(null);
      await expect(service.verifyOtp(dto)).rejects.toThrow(BadRequestException);
    });

    it('should throw if new user missing email/fullName', async () => {
      const incompleteDto = { phone: dto.phone, otp: '123456' } as VerifyOtpDto;
      mockRedis.get.mockResolvedValue('123456');
      mockAuthRepo.findByPhone.mockResolvedValue(null);
      await expect(service.verifyOtp(incompleteDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw if email already exists for new user', async () => {
      mockRedis.get.mockResolvedValue('123456');
      mockAuthRepo.findByPhone.mockResolvedValue(null);
      mockAuthRepo.findByEmail.mockResolvedValue({ id: 'other' });
      await expect(service.verifyOtp(dto)).rejects.toThrow(ConflictException);
    });
  });

  describe('register', () => {
    const dto: RegisterDto = {
      phone: '+2348012345678',
      email: 'test@example.com',
      fullName: 'Test User',
    };

    it('should create user and return tokens', async () => {
      mockAuthRepo.findFirst.mockResolvedValue(null);
      const newUser = { id: 'user1', ...dto, isPhoneVerified: true };
      mockAuthRepo.create.mockResolvedValue(newUser);
      mockJwtService.sign
        .mockReturnValueOnce('access_token')
        .mockReturnValueOnce('refresh_token');
      mockConfig.get.mockReturnValue('15m');
      mockedBcrypt.hash.mockResolvedValue('hashed' as never);
      mockAuthRepo.update.mockResolvedValue(newUser);

      const result = await service.register(dto);
      expect(result.user).toEqual(newUser);
      expect(mockAuthRepo.create).toHaveBeenCalledWith(
        dto.phone,
        dto.email,
        dto.fullName,
      );
      expect(mockEventEmitter.emit).toHaveBeenCalled();
    });

    it('should throw ConflictException if user exists', async () => {
      mockAuthRepo.findFirst.mockResolvedValue({ id: 'existing' });
      await expect(service.register(dto)).rejects.toThrow(ConflictException);
    });
  });

  describe('refreshTokens', () => {
    it('should generate new tokens when refresh token valid', async () => {
      const refreshToken = 'valid_refresh';
      const userId = 'user1';
      mockJwtService.verify.mockReturnValue({ sub: userId });
      mockAuthRepo.findById.mockResolvedValue({
        id: userId,
        refreshTokenHash: 'stored_hash',
      });
      mockedBcrypt.compare.mockResolvedValue(true as never);
      mockJwtService.sign
        .mockReturnValueOnce('new_access')
        .mockReturnValueOnce('new_refresh');
      mockConfig.get.mockReturnValue('15m');
      mockedBcrypt.hash.mockResolvedValue('new_hash' as never);
      mockAuthRepo.update.mockResolvedValue({});

      const result = await service.refreshTokens(refreshToken);
      expect(result).toHaveProperty('accessToken', 'new_access');
      expect(result).toHaveProperty('refreshToken', 'new_refresh');
      expect(mockAuthRepo.update).toHaveBeenCalledWith(userId, {
        refreshTokenHash: 'new_hash',
      });
    });

    it('should throw if refresh token invalid', async () => {
      mockJwtService.verify.mockImplementation(() => {
        throw new Error();
      });
      await expect(service.refreshTokens('invalid')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw if user not found or no refresh hash', async () => {
      mockJwtService.verify.mockReturnValue({ sub: 'user1' });
      mockAuthRepo.findById.mockResolvedValue(null);
      await expect(service.refreshTokens('token')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('logout', () => {
    it('should clear refresh token hash', async () => {
      mockAuthRepo.update.mockResolvedValue({});
      const result = await service.logout('user1');
      expect(result).toEqual({ message: 'Logged out' });
      expect(mockAuthRepo.update).toHaveBeenCalledWith('user1', {
        refreshTokenHash: null,
      });
    });
  });
});
