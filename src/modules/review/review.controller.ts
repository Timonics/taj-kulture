import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ReviewService } from './application/review.service';
import { CreateReviewDto } from './application/dto/create-review.dto';
import { ReviewQueryDto } from './application/dto/review-query.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';

@Controller('reviews')
export class ReviewController {
  constructor(private reviewService: ReviewService) {}

  // Public – get reviews for a product
  @Public()
  @Get('product/:productId')
  async getProductReviews(
    @Param('productId') productId: string,
    @Query() query: ReviewQueryDto,
  ) {
    return this.reviewService.getProductReviews(productId, query);
  }

  // Authenticated – create review
  @UseGuards(JwtAuthGuard)
  @Post('product/:productId')
  async createReview(
    @Request() req,
    @Param('productId') productId: string,
    @Body() dto: CreateReviewDto,
  ) {
    return this.reviewService.createReview(req.user.id, productId, dto);
  }

  // Authenticated – get my reviews
  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMyReviews(@Request() req, @Query() query: ReviewQueryDto) {
    return this.reviewService.getUserReviews(req.user.id, query);
  }

  // Authenticated – delete own review
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async deleteReview(@Request() req, @Param('id') id: string) {
    return this.reviewService.deleteReview(req.user.id, id, false);
  }

  // Admin – delete any review
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Delete('admin/:id')
  async adminDeleteReview(@Param('id') id: string) {
    return this.reviewService.deleteReview('', id, true);
  }
}
