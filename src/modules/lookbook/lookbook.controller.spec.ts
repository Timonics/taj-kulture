import { Test, TestingModule } from '@nestjs/testing';
import { LookbookController } from './lookbook.controller';
import { LookbookService } from './application/lookbook.service';
import { CreateLookbookPostDto } from './application/dto/create-lookbook-post.dto';
import { UpdateLookbookStatusDto } from './application/dto/update-lookbook-status.dto';
import { LookbookQueryDto } from './application/dto/lookbook-query.dto';

describe('LookbookController', () => {
  let controller: LookbookController;
  let mockService: jest.Mocked<LookbookService>;

  beforeEach(async () => {
    mockService = {
      getApprovedPosts: jest.fn(),
      createPost: jest.fn(),
      getUserPosts: jest.fn(),
      deleteOwnPost: jest.fn(),
      getPendingPosts: jest.fn(),
      moderatePost: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [LookbookController],
      providers: [{ provide: LookbookService, useValue: mockService }],
    }).compile();

    controller = module.get<LookbookController>(LookbookController);
  });

  describe('getGallery (public)', () => {
    it('should call service.getApprovedPosts with query', async () => {
      const query: LookbookQueryDto = { page: 2, limit: 10 };
      const expected = { data: [], meta: {} };
      mockService.getApprovedPosts.mockResolvedValue(expected as any);

      const result = await controller.getGallery(query);

      expect(result).toEqual(expected);
      expect(mockService.getApprovedPosts).toHaveBeenCalledWith(query);
    });
  });

  describe('createPost (authenticated)', () => {
    it('should call service.createPost with user id and dto', async () => {
      const req = { user: { id: 'user1' } };
      const dto: CreateLookbookPostDto = {
        imageUrl: 'http://img.com',
        caption: 'fit',
      };
      const expected = { id: 'post1' };
      mockService.createPost.mockResolvedValue(expected as any);

      const result = await controller.createPost(req, dto);

      expect(result).toEqual(expected);
      expect(mockService.createPost).toHaveBeenCalledWith('user1', dto);
    });
  });

  describe('getMyPosts (authenticated)', () => {
    it('should call service.getUserPosts with pagination', async () => {
      const req = { user: { id: 'user1' } };
      const expected = [{ id: 'post1' }];
      mockService.getUserPosts.mockResolvedValue(expected as any);

      const result = await controller.getMyPosts(req, 2, 5);

      expect(result).toEqual(expected);
      expect(mockService.getUserPosts).toHaveBeenCalledWith('user1', 2, 5);
    });

    it('should use default pagination when not provided', async () => {
      const req = { user: { id: 'user1' } };
      await controller.getMyPosts(req, undefined, undefined);
      expect(mockService.getUserPosts).toHaveBeenCalledWith('user1', 1, 20);
    });
  });

  describe('deletePost (authenticated)', () => {
    it('should call service.deleteOwnPost', async () => {
      const req = { user: { id: 'user1' } };
      const expected = { message: 'Post deleted' };
      mockService.deleteOwnPost.mockResolvedValue(expected as any);

      const result = await controller.deletePost(req, 'post1');

      expect(result).toEqual(expected);
      expect(mockService.deleteOwnPost).toHaveBeenCalledWith('user1', 'post1');
    });
  });

  describe('getPendingPosts (admin)', () => {
    it('should call service.getPendingPosts with query', async () => {
      const query: LookbookQueryDto = { page: 1, limit: 10 };
      const expected = { data: [], meta: {} };
      mockService.getPendingPosts.mockResolvedValue(expected as any);

      const result = await controller.getPendingPosts(query);

      expect(result).toEqual(expected);
      expect(mockService.getPendingPosts).toHaveBeenCalledWith(query);
    });
  });

  describe('moderatePost (admin)', () => {
    it('should call service.moderatePost with id and dto', async () => {
      const dto: UpdateLookbookStatusDto = { status: 'approved' };
      const expected = { id: 'post1', status: 'approved' };
      mockService.moderatePost.mockResolvedValue(expected as any);

      const result = await controller.moderatePost('post1', dto);

      expect(result).toEqual(expected);
      expect(mockService.moderatePost).toHaveBeenCalledWith('post1', dto);
    });
  });
});
