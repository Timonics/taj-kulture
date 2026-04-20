import { Test, TestingModule } from '@nestjs/testing';
import { ProductController } from './product.controller';
import { ProductService } from './application/product.service';
import { CreateProductDto } from './application/dto/create-product.dto';
import { UpdateProductDto } from './application/dto/update-product.dto';
import { CreateVariantDto } from './application/dto/create-variant.dto';
import { ProductQueryDto } from './application/dto/product-query.dto';

describe('ProductController', () => {
  let controller: ProductController;
  let mockService: jest.Mocked<ProductService>;

  beforeEach(async () => {
    mockService = {
      getProducts: jest.fn(),
      getProductBySlug: jest.fn(),
      getVariants: jest.fn(),
      createProduct: jest.fn(),
      updateProduct: jest.fn(),
      deleteProduct: jest.fn(),
      addVariant: jest.fn(),
      updateVariant: jest.fn(),
      deleteVariant: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductController],
      providers: [{ provide: ProductService, useValue: mockService }],
    }).compile();

    controller = module.get<ProductController>(ProductController);
  });

  describe('getProducts (public)', () => {
    it('should call service.getProducts with query', async () => {
      const query: ProductQueryDto = { category: 'Tee', page: 2, limit: 10 };
      const expected = { data: [], meta: {} };
      mockService.getProducts.mockResolvedValue(expected as any);

      const result = await controller.getProducts(query);

      expect(result).toEqual(expected);
      expect(mockService.getProducts).toHaveBeenCalledWith(query);
    });
  });

  describe('getProductBySlug (public)', () => {
    it('should call service.getProductBySlug with slug', async () => {
      const expected = { id: 'p1', name: 'Test' };
      mockService.getProductBySlug.mockResolvedValue(expected as any);

      const result = await controller.getProductBySlug('test-slug');

      expect(result).toEqual(expected);
      expect(mockService.getProductBySlug).toHaveBeenCalledWith('test-slug');
    });
  });

  describe('getVariants (public)', () => {
    it('should call service.getVariants with productId', async () => {
      const expected = [{ id: 'v1' }];
      mockService.getVariants.mockResolvedValue(expected as any);

      const result = await controller.getVariants('p1');

      expect(result).toEqual(expected);
      expect(mockService.getVariants).toHaveBeenCalledWith('p1');
    });
  });

  describe('createProduct (admin)', () => {
    it('should call service.createProduct with dto', async () => {
      const dto: CreateProductDto = { name: 'Tee', slug: 'tee', basePrice: 5000, category: 'Tee' };
      const expected = { id: 'p1', ...dto };
      mockService.createProduct.mockResolvedValue(expected as any);

      const result = await controller.createProduct(dto);

      expect(result).toEqual(expected);
      expect(mockService.createProduct).toHaveBeenCalledWith(dto);
    });
  });

  describe('updateProduct (admin)', () => {
    it('should call service.updateProduct with id and dto', async () => {
      const dto: UpdateProductDto = { name: 'Updated' };
      const expected = { id: 'p1', ...dto };
      mockService.updateProduct.mockResolvedValue(expected as any);

      const result = await controller.updateProduct('p1', dto);

      expect(result).toEqual(expected);
      expect(mockService.updateProduct).toHaveBeenCalledWith('p1', dto);
    });
  });

  describe('deleteProduct (admin)', () => {
    it('should call service.deleteProduct with id', async () => {
      const expected = { message: 'Product deleted' };
      mockService.deleteProduct.mockResolvedValue(expected as any);

      const result = await controller.deleteProduct('p1');

      expect(result).toEqual(expected);
      expect(mockService.deleteProduct).toHaveBeenCalledWith('p1');
    });
  });

  describe('addVariant (admin)', () => {
    it('should call service.addVariant with productId and dto', async () => {
      const dto: CreateVariantDto = { size: 'M', color: 'Black', additionalPrice: 0, stockQuantity: 10 };
      const expected = { id: 'v1', ...dto };
      mockService.addVariant.mockResolvedValue(expected as any);

      const result = await controller.addVariant('p1', dto);

      expect(result).toEqual(expected);
      expect(mockService.addVariant).toHaveBeenCalledWith('p1', dto);
    });
  });

  describe('updateVariant (admin)', () => {
    it('should call service.updateVariant with variantId and dto', async () => {
      const dto = { stockQuantity: 5 };
      const expected = { id: 'v1', ...dto };
      mockService.updateVariant.mockResolvedValue(expected as any);

      const result = await controller.updateVariant('v1', dto);

      expect(result).toEqual(expected);
      expect(mockService.updateVariant).toHaveBeenCalledWith('v1', dto);
    });
  });

  describe('deleteVariant (admin)', () => {
    it('should call service.deleteVariant with variantId', async () => {
      const expected = { message: 'Variant deleted' };
      mockService.deleteVariant.mockResolvedValue(expected as any);

      const result = await controller.deleteVariant('v1');

      expect(result).toEqual(expected);
      expect(mockService.deleteVariant).toHaveBeenCalledWith('v1');
    });
  });
});