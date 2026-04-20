import { Module } from '@nestjs/common';
import { LookbookController } from './lookbook.controller';
import { LookbookService } from './application/lookbook.service';
import { PrismaLookbookRepository } from './infrastructure/lookbook.repository.impl';
import { LookbookApprovedHandler } from './application/handlers/lookbook-approved.handler';
import { LookbookRejectedHandler } from './application/handlers/lookbook-rejected.handler';
import { UserModule } from '../user/user.module';
import { QueueModule } from '../../shared/infrastructure/queue/queue.module';

@Module({
  imports: [UserModule, QueueModule],
  controllers: [LookbookController],
  providers: [
    LookbookService,
    LookbookApprovedHandler,
    LookbookRejectedHandler,
    { provide: 'LookbookRepository', useClass: PrismaLookbookRepository },
  ],
})
export class LookbookModule {}
