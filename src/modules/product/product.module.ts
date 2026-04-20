import { Module } from '@nestjs/common';
import { ProductController } from './product.controller';
import { ProductService } from './application/product.service';
import { PrismaProductRepository } from './infrastructure/product.repository.impl';
import { PrismaModule } from '../../shared/infrastructure/database/prisma.module';
import { QueueModule } from '@/shared/infrastructure/queue/queue.module';

@Module({
  imports: [PrismaModule, QueueModule],
  controllers: [ProductController],
  providers: [
    ProductService,
    { provide: 'ProductRepository', useClass: PrismaProductRepository },
  ],
  exports: [ProductService],
})
export class ProductModule {}