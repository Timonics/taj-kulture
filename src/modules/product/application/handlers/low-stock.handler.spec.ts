import { Test, TestingModule } from '@nestjs/testing';
import { LowStockHandler } from './low-stock.handler';
import { QueueService } from '../../../../shared/infrastructure/queue/queue.service';
import { LowStockEvent } from '../../domain/events/low-stock.event';

describe('LowStockHandler', () => {
  let handler: LowStockHandler;
  let mockQueueService: jest.Mocked<QueueService>;

  beforeEach(async () => {
    mockQueueService = {
      addEmailJob: jest.fn(),
      addNotificationJob: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LowStockHandler,
        { provide: QueueService, useValue: mockQueueService },
      ],
    }).compile();

    handler = module.get<LowStockHandler>(LowStockHandler);
  });

  it('should send email and notification on low stock event', async () => {
    const event = new LowStockEvent('variant-123', 'product-456', 3);
    await handler.handle(event);

    expect(mockQueueService.addEmailJob).toHaveBeenCalledWith({
      to: expect.any(String),
      subject: 'Low Stock Alert',
      template: 'low-stock',
      context: {
        variantId: 'variant-123',
        productId: 'product-456',
        currentStock: 3,
      },
    });

    expect(mockQueueService.addNotificationJob).toHaveBeenCalledWith(
      'admin',
      'Low Stock Alert',
      'Product variant variant-123 has only 3 left.',
    );
  });
});
