import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ProductService } from './product.service';
import { ProductRepository } from '../domain/product.repository.interface';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { CreateVariantDto } from './dto/create-variant.dto';
import { ProductCreatedEvent } from '../domain/events/product-created.event';
import { ProductUpdatedEvent } from '../domain/events/product-updated.event';
import { LowStockEvent } from '../domain/events/low-stock.event';
import { CloudinaryService } from '@/shared/infrastructure/cloudinary/cloudinary.service';

describe('ProductService', () => {
  let service: ProductService;
  let mockRepo: jest.Mocked<ProductRepository>;
  let mockEventEmitter: jest.Mocked<EventEmitter2>;
  let mockCloudinaryService: jest.Mocked<CloudinaryService>;

  beforeEach(async () => {
    mockRepo = {
      createProduct: jest.fn(),
      updateProduct: jest.fn(),
      findProductById: jest.fn(),
      findProductBySlug: jest.fn(),
      findProducts: jest.fn(),
      countProducts: jest.fn(),
      deleteProduct: jest.fn(),
      createVariant: jest.fn(),
      updateVariant: jest.fn(),
      findVariantById: jest.fn(),
      findVariantsByProduct: jest.fn(),
      deleteVariant: jest.fn(),
    };

    mockEventEmitter = { emit: jest.fn() } as any;

    mockCloudinaryService = {
      uploadFile: jest.fn(),
      uploadMultipleFiles: jest.fn(),
      deleteFile: jest.fn(),
      getFileUrl: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductService,
        { provide: 'ProductRepository', useValue: mockRepo },
        { provide: EventEmitter2, useValue: mockEventEmitter },
        { provide: CloudinaryService, useValue: mockCloudinaryService },
      ],
    }).compile();

    service = module.get<ProductService>(ProductService);
  });

  describe('createProduct', () => {
    it('should create a product and emit event', async () => {
      const dto: CreateProductDto = {
        name: 'Test Tee',
        slug: 'test-tee',
        basePrice: 5000,
        category: 'T-Shirts',
        description: 'A cool tee',
      };
      const created = { id: 'prod1', ...dto };
      mockRepo.findProductBySlug.mockResolvedValue(null);
      mockRepo.createProduct.mockResolvedValue(created as any);

      const result = await service.createProduct(dto);

      expect(result).toEqual(created);
      expect(mockRepo.createProduct).toHaveBeenCalledWith(dto);
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'product.created',
        expect.any(ProductCreatedEvent),
      );
    });

    it('should throw ConflictException if slug exists', async () => {
      const dto = { slug: 'existing-slug' } as CreateProductDto;
      mockRepo.findProductBySlug.mockResolvedValue({ id: 'existing' } as any);
      await expect(service.createProduct(dto)).rejects.toThrow(
        ConflictException,
      );
      expect(mockRepo.createProduct).not.toHaveBeenCalled();
    });
  });

  describe('updateProduct', () => {
    it('should update product and emit event', async () => {
      const productId = 'prod1';
      const existing = { id: productId, slug: 'old-slug', name: 'Old' };
      const dto: UpdateProductDto = { name: 'New Name', slug: 'new-slug' };
      const updated = { ...existing, ...dto };
      mockRepo.findProductById.mockResolvedValue(existing as any);
      mockRepo.findProductBySlug.mockResolvedValue(null);
      mockRepo.updateProduct.mockResolvedValue(updated as any);

      const result = await service.updateProduct(productId, dto);

      expect(result).toEqual(updated);
      expect(mockRepo.updateProduct).toHaveBeenCalledWith(productId, dto);
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'product.updated',
        expect.any(ProductUpdatedEvent),
      );
    });

    it('should throw NotFoundException if product not found', async () => {
      mockRepo.findProductById.mockResolvedValue(null);
      await expect(service.updateProduct('invalid', {})).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ConflictException if new slug already exists', async () => {
      const productId = 'prod1';
      const existing = { id: productId, slug: 'old-slug' };
      mockRepo.findProductById.mockResolvedValue(existing as any);
      mockRepo.findProductBySlug.mockResolvedValue({ id: 'other' } as any);
      await expect(
        service.updateProduct(productId, { slug: 'taken' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('getProducts (public)', () => {
    it('should return paginated products with filters', async () => {
      const query = { category: 'Tee', page: 2, limit: 10 };
      const products = [{ id: 'p1' }, { id: 'p2' }];
      mockRepo.findProducts.mockResolvedValue(products as any);
      mockRepo.countProducts.mockResolvedValue(25);

      const result = await service.getProducts(query as any);

      expect(result).toEqual({
        data: products,
        meta: { page: 2, limit: 10, total: 25, totalPages: 3 },
      });
      expect(mockRepo.findProducts).toHaveBeenCalledWith(
        { category: 'Tee', isActive: true },
        2,
        10,
      );
      expect(mockRepo.countProducts).toHaveBeenCalledWith({
        category: 'Tee',
        isActive: true,
      });
    });
  });

  describe('getProductBySlug', () => {
    it('should return product with variants', async () => {
      const product = { id: 'p1', name: 'Test', slug: 'test' };
      const variants = [{ id: 'v1' }];
      mockRepo.findProductBySlug.mockResolvedValue(product as any);
      mockRepo.findVariantsByProduct.mockResolvedValue(variants as any);

      const result = await service.getProductBySlug('test');

      expect(result).toEqual({ ...product, variants });
    });

    it('should throw NotFoundException if product not found', async () => {
      mockRepo.findProductBySlug.mockResolvedValue(null);
      await expect(service.getProductBySlug('unknown')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('deleteProduct', () => {
    it('should delete product', async () => {
      const product = { id: 'p1' };
      mockRepo.findProductById.mockResolvedValue(product as any);
      mockRepo.deleteProduct.mockResolvedValue(undefined);
      const result = await service.deleteProduct('p1');
      expect(result).toEqual({ message: 'Product deleted' });
      expect(mockRepo.deleteProduct).toHaveBeenCalledWith('p1');
    });

    it('should delete product and its images from Cloudinary', async () => {
      const product = {
        id: 'p1',
        images: [
          'https://res.cloudinary.com/.../img1.jpg',
          'https://res.cloudinary.com/.../img2.jpg',
        ],
      };
      mockRepo.findProductById.mockResolvedValue(product as any);
      mockCloudinaryService.deleteFile = jest.fn().mockResolvedValue({});
      mockRepo.deleteProduct.mockResolvedValue(undefined);

      const result = await service.deleteProduct('p1');
      expect(result).toEqual({ message: 'Product deleted' });
      expect(mockCloudinaryService.deleteFile).toHaveBeenCalledTimes(2);
    });

    it('should throw if product not found', async () => {
      mockRepo.findProductById.mockResolvedValue(null);
      await expect(service.deleteProduct('invalid')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('addVariant', () => {
    it('should add variant and emit low stock if stock ≤5', async () => {
      const productId = 'p1';
      const dto: CreateVariantDto = {
        size: 'M',
        color: 'Black',
        additionalPrice: 1000,
        stockQuantity: 3,
        sku: 'SKU123',
      };
      const product = { id: productId };
      const variant = { id: 'v1', productId, ...dto };
      mockRepo.findProductById.mockResolvedValue(product as any);
      mockRepo.createVariant.mockResolvedValue(variant as any);

      const result = await service.addVariant(productId, dto);

      expect(result).toEqual(variant);
      expect(mockRepo.createVariant).toHaveBeenCalledWith(productId, dto);
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'product.lowStock',
        expect.any(LowStockEvent),
      );
    });

    it('should not emit low stock if stock >5', async () => {
      const dto = { stockQuantity: 10 } as CreateVariantDto;
      mockRepo.findProductById.mockResolvedValue({ id: 'p1' } as any);
      mockRepo.createVariant.mockResolvedValue({ id: 'v1' } as any);
      await service.addVariant('p1', dto);
      expect(mockEventEmitter.emit).not.toHaveBeenCalled();
    });

    it('should throw if product not found', async () => {
      mockRepo.findProductById.mockResolvedValue(null);
      await expect(service.addVariant('invalid', {} as any)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateVariant', () => {
    it('should update variant and emit low stock if new stock ≤5', async () => {
      const variantId = 'v1';
      const existingVariant = {
        id: variantId,
        productId: 'p1',
        stockQuantity: 10,
      };
      const dto = { stockQuantity: 2 };
      const updated = { ...existingVariant, ...dto };
      mockRepo.findVariantById.mockResolvedValue(existingVariant as any);
      mockRepo.updateVariant.mockResolvedValue(updated as any);

      const result = await service.updateVariant(variantId, dto);

      expect(result).toEqual(updated);
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'product.lowStock',
        expect.any(LowStockEvent),
      );
    });

    it('should not emit low stock if stock unchanged or >5', async () => {
      const variant = { id: 'v1', productId: 'p1', stockQuantity: 10 };
      mockRepo.findVariantById.mockResolvedValue(variant as any);
      mockRepo.updateVariant.mockResolvedValue(variant as any);
      await service.updateVariant('v1', { size: 'L' });
      expect(mockEventEmitter.emit).not.toHaveBeenCalled();
    });

    it('should throw if variant not found', async () => {
      mockRepo.findVariantById.mockResolvedValue(null);
      await expect(service.updateVariant('invalid', {})).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('deleteVariant', () => {
    it('should delete variant', async () => {
      const variant = { id: 'v1' };
      mockRepo.findVariantById.mockResolvedValue(variant as any);
      mockRepo.deleteVariant.mockResolvedValue(undefined);
      const result = await service.deleteVariant('v1');
      expect(result).toEqual({ message: 'Variant deleted' });
    });

    it('should throw if variant not found', async () => {
      mockRepo.findVariantById.mockResolvedValue(null);
      await expect(service.deleteVariant('invalid')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getVariants', () => {
    it('should return variants for product', async () => {
      const variants = [{ id: 'v1' }];
      mockRepo.findVariantsByProduct.mockResolvedValue(variants as any);
      const result = await service.getVariants('p1');
      expect(result).toEqual(variants);
    });
  });
});
