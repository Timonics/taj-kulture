import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Inject,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { LookbookRepository } from '../domain/lookbook.repository.interface';
import { CreateLookbookPostDto } from './dto/create-lookbook-post.dto';
import { UpdateLookbookStatusDto } from './dto/update-lookbook-status.dto';
import { LookbookQueryDto } from './dto/lookbook-query.dto';
import { LookbookPostCreatedEvent } from '../domain/events/lookbook-post-created.event';
import { LookbookPostApprovedEvent } from '../domain/events/lookbook-post-approved.event';
import { LookbookPostRejectedEvent } from '../domain/events/lookbook-post-rejected.event';
import { UserService } from '../../user/application/user.service';
import { CloudinaryService } from '@/shared/infrastructure/cloudinary/cloudinary.service';
import { extractPublicId } from '@/shared/utils/cloudinary.util';

@Injectable()
export class LookbookService {
  constructor(
    @Inject('LookbookRepository')
    private lookbookRepository: LookbookRepository,
    private eventEmitter: EventEmitter2,
    private userService: UserService,
    private cloudinaryService: CloudinaryService,
  ) {}

  // User endpoints
  async createPost(userId: string, dto: CreateLookbookPostDto) {
    const post = await this.lookbookRepository.create({
      userId,
      imageUrl: dto.imageUrl,
      taggedProductIds: dto.taggedProductIds || [],
      caption: dto.caption,
      status: 'pending',
    });
    this.eventEmitter.emit(
      'lookbook.post.created',
      new LookbookPostCreatedEvent(post.id, userId, post.imageUrl),
    );
    return post;
  }

  async getUserPosts(userId: string, page: number, limit: number) {
    return this.lookbookRepository.findByUser(userId, page, limit);
  }

  async deleteOwnPost(userId: string, postId: string) {
    const post = await this.lookbookRepository.findById(postId);
    if (!post) throw new NotFoundException('Post not found');
    if (post.userId !== userId)
      throw new ForbiddenException('You can only delete your own posts');

    // Delete image from Cloudinary
    if (post.imageUrl) {
      const publicId = extractPublicId(post.imageUrl);
      await this.cloudinaryService.deleteFile(publicId);
    }

    await this.lookbookRepository.delete(postId);
    return { message: 'Post deleted' };
  }

  // Public gallery
  async getApprovedPosts(query: LookbookQueryDto) {
    const { page, limit } = query;
    const [posts, total] = await Promise.all([
      this.lookbookRepository.findApproved(page!, limit!),
      this.lookbookRepository.countByStatus('approved'),
    ]);
    return {
      data: posts,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit!) },
    };
  }

  // Admin endpoints
  async getPendingPosts(query: LookbookQueryDto) {
    const { page, limit } = query;
    const [posts, total] = await Promise.all([
      this.lookbookRepository.findPending(page!, limit!),
      this.lookbookRepository.countByStatus('pending'),
    ]);
    return {
      data: posts,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit!) },
    };
  }

  async moderatePost(postId: string, dto: UpdateLookbookStatusDto) {
    const post = await this.lookbookRepository.findById(postId);
    if (!post) throw new NotFoundException('Post not found');
    if (post.status !== 'pending')
      throw new ForbiddenException('Post already moderated');
    const updated = await this.lookbookRepository.updateStatus(
      postId,
      dto.status,
    );
    if (dto.status === 'approved') {
      this.eventEmitter.emit(
        'lookbook.post.approved',
        new LookbookPostApprovedEvent(postId, post.userId),
      );
      // Award Sabi points for approved lookbook (e.g., 15 points)
      await this.userService.addSabiScore(
        post.userId,
        15,
        'Lookbook post approved',
      );
    } else {
      if (post?.imageUrl) {
        const publicId = extractPublicId(post.imageUrl);
        await this.cloudinaryService.deleteFile(publicId);
      }

      this.eventEmitter.emit(
        'lookbook.post.rejected',
        new LookbookPostRejectedEvent(postId, post.userId, dto.rejectionReason),
      );
    }
    return updated;
  }
}
