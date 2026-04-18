import { Module } from '@nestjs/common';
import { UserService } from './application/user.service';
import { UserController } from './user.controller';
import { PrismaUserRepository } from './repository/user.repository.impl';
import { UserRepository } from './repository/user.repository.interface';
import { UserRegisteredHandler } from './application/handlers/user-registered.handler';
import { EventEmitterModule } from '@nestjs/event-emitter';

@Module({
  imports: [
    EventEmitterModule.forRoot({
      wildcard: false,
      delimiter: '.',
      newListener: false,
      removeListener: false,
      maxListeners: 10,
      verboseMemoryLeak: false,
      ignoreErrors: false,
    }),
  ],
  controllers: [UserController],
  providers: [
    UserService,
    UserRegisteredHandler,
    {
      provide: 'UserRepository',
      useClass: PrismaUserRepository,
    },
  ],
  exports: [UserService],
})
export class UserModule {}
