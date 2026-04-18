import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { UserService } from '../user.service';
import { UserRegisteredEvent } from '@/modules/auth/domain/events/user-registered.event';

@Injectable()
export class UserRegisteredHandler {
  constructor(private userService: UserService) {}

  @OnEvent('auth.user.registered')
  async handle(event: UserRegisteredEvent) {
    // Give 10 Sabi points for joining
    await this.userService.addSabiScore(event.userId, 10, 'Welcome bonus');
  }
}
