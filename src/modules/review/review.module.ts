import { Module } from '@nestjs/common';
import { ReviewController } from './review.controller';
import { ReviewService } from './application/review.service';
import { PrismaReviewRepository } from './infrastructure/review.repository.impl';
import { PrismaModule } from '../../shared/infrastructure/database/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ReviewController],
  providers: [
    ReviewService,
    { provide: 'ReviewRepository', useClass: PrismaReviewRepository },
  ],
})
export class ReviewModule {}
