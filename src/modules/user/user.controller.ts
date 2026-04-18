import { Controller, Get, Patch, Body, Post, UseGuards, Request } from '@nestjs/common';
import { UserService } from './application/user.service';
import { UpdateProfileDto } from './application/dto/update-profile.dto';
import { ApplyReferralDto } from './application/dto/apply-referral.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(private userService: UserService) {}

  @Get('me')
  async getProfile(@Request() req) {
    return this.userService.getProfile(req.user.id);
  }

  @Patch('me')
  async updateProfile(@Request() req, @Body() dto: UpdateProfileDto) {
    return this.userService.updateProfile(req.user.id, dto);
  }

  @Post('referral/apply')
  async applyReferral(@Request() req, @Body() dto: ApplyReferralDto) {
    return this.userService.applyReferral(req.user.id, dto);
  }
}