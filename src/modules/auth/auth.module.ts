import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './application/auth.service';
import { AuthController } from './auth.controller';
import { UserRegisteredHandler } from './application/handlers/user-registered.handler';
import { PrismaAuthRepository } from './infrastructure/auth.repository.impl';

@Module({
  imports: [
    JwtModule.registerAsync({
      useFactory: (config: ConfigService) => ({
        secret: config.get('jwt.secret'),
        signOptions: { expiresIn: config.get('jwt.expiresIn') },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    UserRegisteredHandler,
    { provide: 'AuthRepository', useClass: PrismaAuthRepository },
  ],
})
export class AuthModule {}
