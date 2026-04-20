import { Module } from '@nestjs/common';
import { UserService } from './application/user.service';
import { UserController } from './user.controller';
import { PrismaUserRepository } from './infrastructure/user.repository.impl';
import { UserRegisteredHandler } from './application/handlers/user-registered.handler';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { CloudinaryModule } from '@/shared/infrastructure/cloudinary/cloudinary.module';

@Module({
  imports: [
    CloudinaryModule,
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
