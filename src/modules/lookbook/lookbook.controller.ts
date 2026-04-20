import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { LookbookService } from './application/lookbook.service';
import { CreateLookbookPostDto } from './application/dto/create-lookbook-post.dto';
import { UpdateLookbookStatusDto } from './application/dto/update-lookbook-status.dto';
import { LookbookQueryDto } from './application/dto/lookbook-query.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';

@Controller('lookbook')
export class LookbookController {
  constructor(private lookbookService: LookbookService) {}

  // Public gallery – approved posts only
  @Public()
  @Get()
  async getGallery(@Query() query: LookbookQueryDto) {
    return this.lookbookService.getApprovedPosts(query);
  }

  // User – create post
  @UseGuards(JwtAuthGuard)
  @Post()
  async createPost(@Request() req, @Body() dto: CreateLookbookPostDto) {
    return this.lookbookService.createPost(req.user.id, dto);
  }

  // User – get own posts
  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMyPosts(
    @Request() req,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.lookbookService.getUserPosts(req.user.id, page, limit);
  }

  // User – delete own post
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async deletePost(@Request() req, @Param('id') id: string) {
    return this.lookbookService.deleteOwnPost(req.user.id, id);
  }

  // Admin – get pending posts
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Get('admin/pending')
  async getPendingPosts(@Query() query: LookbookQueryDto) {
    return this.lookbookService.getPendingPosts(query);
  }

  // Admin – approve/reject post
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Put(':id/moderate')
  async moderatePost(
    @Param('id') id: string,
    @Body() dto: UpdateLookbookStatusDto,
  ) {
    return this.lookbookService.moderatePost(id, dto);
  }
}
