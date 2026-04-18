import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { UserRepository } from '../repository/user.repository.interface';

describe('UserService', () => {
  let service: UserService;
  let mockRepo: jest.Mocked<UserRepository>;
  let mockEventEmitter: jest.Mocked<EventEmitter2>;

  beforeEach(async () => {
    mockRepo = {
      findById: jest.fn(),
      findByReferralCode: jest.fn(),
      updateSabiScore: jest.fn(),
      updateProfile: jest.fn(),
      createReferral: jest.fn(),
    };
    mockEventEmitter = { emit: jest.fn() } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: 'UserRepository', useValue: mockRepo },
        { provide: EventEmitter2, useValue: mockEventEmitter },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  it('should get profile', async () => {
    const mockUser = {
      id: '1',
      email: 'test@test.com',
      fullName: 'Test',
      sabiScore: 10,
      referralCode: 'ABC',
    };
    mockRepo.findById.mockResolvedValue(mockUser as any);
    const result = await service.getProfile('1');
    expect(result).toMatchObject({ id: '1', email: 'test@test.com' });
    expect(result).not.toHaveProperty('refreshTokenHash');
  });

  it('should add Sabi score and emit event', async () => {
    mockRepo.findById.mockResolvedValue({ id: '1', sabiScore: 10 } as any);
    mockRepo.updateSabiScore.mockResolvedValue({
      id: '1',
      sabiScore: 20,
    } as any);
    await service.addSabiScore('1', 10, 'test');
    expect(mockRepo.updateSabiScore).toHaveBeenCalledWith('1', 20);
    expect(mockEventEmitter.emit).toHaveBeenCalledWith(
      'user.sabiScore.updated',
      expect.objectContaining({
        userId: '1',
        oldScore: 10,
        newScore: 20,
        reason: 'test',
      }),
    );
  });

  it('should apply referral and award points', async () => {
    const referrer = {
      id: 'ref1',
      referralCode: 'CODE',
      email: 'ref@test.com',
    };
    const user = {
      id: 'user1',
      referralCode: 'USERCODE',
      email: 'user@test.com',
    };
    mockRepo.findById.mockResolvedValueOnce(user as any);
    mockRepo.findByReferralCode.mockResolvedValueOnce(referrer as any);
    mockRepo.createReferral.mockResolvedValue(undefined);
    mockRepo.updateSabiScore.mockResolvedValue({} as any);
    await service.applyReferral('user1', { referralCode: 'CODE' });
    expect(mockRepo.createReferral).toHaveBeenCalledWith('ref1', 'user1');
    expect(mockRepo.updateSabiScore).toHaveBeenCalledWith('ref1', 50);
  });
});
