import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { LookbookService } from './lookbook.service';
import { LookbookRepository } from '../domain/lookbook.repository.interface';
import { UserService } from '../../user/application/user.service';
import { CreateLookbookPostDto } from './dto/create-lookbook-post.dto';
import { UpdateLookbookStatusDto } from './dto/update-lookbook-status.dto';
import { LookbookPostCreatedEvent } from '../domain/events/lookbook-post-created.event';
import { LookbookPostApprovedEvent } from '../domain/events/lookbook-post-approved.event';
import { LookbookPostRejectedEvent } from '../domain/events/lookbook-post-rejected.event';

describe('LookbookService', () => {
  let service: LookbookService;
  let mockRepo: jest.Mocked<LookbookRepository>;
  let mockEventEmitter: jest.Mocked<EventEmitter2>;
  let mockUserService: jest.Mocked<UserService>;

  beforeEach(async () => {
    mockRepo = {
      create: jest.fn(),
      findById: jest.fn(),
      findByUser: jest.fn(),
      findPending: jest.fn(),
      findApproved: jest.fn(),
      updateStatus: jest.fn(),
      delete: jest.fn(),
      countByStatus: jest.fn(),
    };

    mockEventEmitter = { emit: jest.fn() } as any;
    mockUserService = { addSabiScore: jest.fn() } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LookbookService,
        { provide: 'LookbookRepository', useValue: mockRepo },
        { provide: EventEmitter2, useValue: mockEventEmitter },
        { provide: UserService, useValue: mockUserService },
      ],
    }).compile();

    service = module.get<LookbookService>(LookbookService);
  });

  describe('createPost', () => {
    it('should create a pending post and emit event', async () => {
      const userId = 'user1';
      const dto: CreateLookbookPostDto = {
        imageUrl: 'http://cloudinary.com/img.jpg',
        taggedProductIds: ['prod1'],
        caption: 'My fit',
      };
      const createdPost = { id: 'post1', userId, status: 'pending', ...dto };
      mockRepo.create.mockResolvedValue(createdPost as any);

      const result = await service.createPost(userId, dto);

      expect(result).toEqual(createdPost);
      expect(mockRepo.create).toHaveBeenCalledWith({
        userId,
        imageUrl: dto.imageUrl,
        taggedProductIds: dto.taggedProductIds,
        caption: dto.caption,
        status: 'pending',
      });
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'lookbook.post.created',
        expect.any(LookbookPostCreatedEvent),
      );
    });
  });

  describe('getUserPosts', () => {
    it('should return user posts with pagination', async () => {
      const userId = 'user1';
      const posts = [{ id: 'post1' }, { id: 'post2' }];
      mockRepo.findByUser.mockResolvedValue(posts as any);

      const result = await service.getUserPosts(userId, 1, 10);

      expect(result).toEqual(posts);
      expect(mockRepo.findByUser).toHaveBeenCalledWith(userId, 1, 10);
    });
  });

  describe('deleteOwnPost', () => {
    it('should delete post if owned by user', async () => {
      const userId = 'user1';
      const postId = 'post1';
      const post = { id: postId, userId };
      mockRepo.findById.mockResolvedValue(post as any);
      mockRepo.delete.mockResolvedValue(undefined);

      const result = await service.deleteOwnPost(userId, postId);

      expect(result).toEqual({ message: 'Post deleted' });
      expect(mockRepo.delete).toHaveBeenCalledWith(postId);
    });

    it('should throw if post not found', async () => {
      mockRepo.findById.mockResolvedValue(null);
      await expect(service.deleteOwnPost('user1', 'post1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw if user does not own the post', async () => {
      const post = { id: 'post1', userId: 'otherUser' };
      mockRepo.findById.mockResolvedValue(post as any);
      await expect(service.deleteOwnPost('user1', 'post1')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('getApprovedPosts', () => {
    it('should return paginated approved posts', async () => {
      const posts = [{ id: 'post1' }];
      mockRepo.findApproved.mockResolvedValue(posts as any);
      mockRepo.countByStatus.mockResolvedValue(25);

      const result = await service.getApprovedPosts({ page: 2, limit: 10 });

      expect(result).toEqual({
        data: posts,
        meta: { page: 2, limit: 10, total: 25, totalPages: 3 },
      });
      expect(mockRepo.findApproved).toHaveBeenCalledWith(2, 10);
      expect(mockRepo.countByStatus).toHaveBeenCalledWith('approved');
    });
  });

  describe('getPendingPosts (admin)', () => {
    it('should return paginated pending posts', async () => {
      const posts = [{ id: 'post1' }];
      mockRepo.findPending.mockResolvedValue(posts as any);
      mockRepo.countByStatus.mockResolvedValue(5);

      const result = await service.getPendingPosts({ page: 1, limit: 5 });

      expect(result).toEqual({
        data: posts,
        meta: { page: 1, limit: 5, total: 5, totalPages: 1 },
      });
      expect(mockRepo.findPending).toHaveBeenCalledWith(1, 5);
    });
  });

  describe('moderatePost', () => {
    const postId = 'post1';
    const userId = 'user1';

    it('should approve post, emit event, and award Sabi points', async () => {
      const post = { id: postId, userId, status: 'pending' };
      const dto: UpdateLookbookStatusDto = { status: 'approved' };
      const updated = { ...post, status: 'approved' };
      mockRepo.findById.mockResolvedValue(post as any);
      mockRepo.updateStatus.mockResolvedValue(updated as any);
    //   mockUserService.addSabiScore.mockResolvedValue(undefined);

      const result = await service.moderatePost(postId, dto);

      expect(result).toEqual(updated);
      expect(mockRepo.updateStatus).toHaveBeenCalledWith(postId, 'approved');
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'lookbook.post.approved',
        expect.any(LookbookPostApprovedEvent),
      );
      expect(mockUserService.addSabiScore).toHaveBeenCalledWith(
        userId,
        15,
        'Lookbook post approved',
      );
    });

    it('should reject post, emit event, and not award points', async () => {
      const post = { id: postId, userId, status: 'pending' };
      const dto: UpdateLookbookStatusDto = {
        status: 'rejected',
        rejectionReason: 'Not appropriate',
      };
      const updated = { ...post, status: 'rejected' };
      mockRepo.findById.mockResolvedValue(post as any);
      mockRepo.updateStatus.mockResolvedValue(updated as any);

      const result = await service.moderatePost(postId, dto);

      expect(result).toEqual(updated);
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'lookbook.post.rejected',
        expect.any(LookbookPostRejectedEvent),
      );
      expect(mockUserService.addSabiScore).not.toHaveBeenCalled();
    });

    it('should throw if post not found', async () => {
      mockRepo.findById.mockResolvedValue(null);
      await expect(
        service.moderatePost('invalid', { status: 'approved' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw if post already moderated', async () => {
      const post = { id: postId, userId, status: 'approved' };
      mockRepo.findById.mockResolvedValue(post as any);
      await expect(
        service.moderatePost(postId, { status: 'rejected' }),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
