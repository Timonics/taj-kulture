import {
  Injectable,
  NotFoundException,
  ConflictException,
  Inject,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ProductRepository } from '../domain/product.repository.interface';
import { ProductCreatedEvent } from '../domain/events/product-created.event';
import { ProductUpdatedEvent } from '../domain/events/product-updated.event';
import { LowStockEvent } from '../domain/events/low-stock.event';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { CreateVariantDto } from './dto/create-variant.dto';
import { ProductQueryDto } from './dto/product-query.dto';
import { CloudinaryService } from '@/shared/infrastructure/cloudinary/cloudinary.service';
import { extractPublicId } from '@/shared/utils/cloudinary.util';

@Injectable()
export class ProductService {
  constructor(
    @Inject('ProductRepository') private productRepository: ProductRepository,
    private eventEmitter: EventEmitter2,
    private cloudinaryService: CloudinaryService,
  ) {}

  // Public methods
  async getProducts(query: ProductQueryDto) {
    const { category, collection, search, page, limit } = query;
    const filters: any = { isActive: true };
    if (category) filters.category = category;
    if (collection) filters.collection = collection;
    if (search) {
      filters.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }
    const [products, total] = await Promise.all([
      this.productRepository.findProducts(filters, page!, limit!),
      this.productRepository.countProducts(filters),
    ]);
    return {
      data: products,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit!) },
    };
  }

  async getProductBySlug(slug: string) {
    const product = await this.productRepository.findProductBySlug(slug);
    if (!product) throw new NotFoundException('Product not found');
    const variants = await this.productRepository.findVariantsByProduct(
      product.id,
    );
    return { ...product, variants };
  }

  async getProductById(id: string) {
    const product = await this.productRepository.findProductById(id);
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  // Admin methods
  async createProduct(dto: CreateProductDto) {
    const existing = await this.productRepository.findProductBySlug(dto.slug);
    if (existing) throw new ConflictException('Slug already exists');
    const product = await this.productRepository.createProduct({
      ...dto,
      images: dto.images || [],
    });
    this.eventEmitter.emit(
      'product.created',
      new ProductCreatedEvent(product.id, product.name, product.slug),
    );
    return product;
  }

  async updateProduct(id: string, dto: UpdateProductDto) {
    const product = await this.productRepository.findProductById(id);
    if (!product) throw new NotFoundException('Product not found');
    if (dto.slug && dto.slug !== product.slug) {
      const existing = await this.productRepository.findProductBySlug(dto.slug);
      if (existing) throw new ConflictException('Slug already exists');
    }

    // If images are being replaced, delete old images from Cloudinary
    if (dto.images && product.images) {
      const oldPublicIds = product.images.map((img) => extractPublicId(img));
      await Promise.all(
        oldPublicIds.map((pid) => this.cloudinaryService.deleteFile(pid)),
      );
    }

    const updated = await this.productRepository.updateProduct(id, dto);
    this.eventEmitter.emit('product.updated', new ProductUpdatedEvent(id, dto));
    return updated;
  }

  async deleteProduct(id: string) {
    const product = await this.productRepository.findProductById(id);
    if (!product) throw new NotFoundException('Product not found');

    // Delete all associated images from Cloudinary
    if (product.images?.length) {
      const publicIds = product.images.map((img) => extractPublicId(img));
      await Promise.all(
        publicIds.map((pid) => this.cloudinaryService.deleteFile(pid)),
      );
    }

    await this.productRepository.deleteProduct(id);
    return { message: 'Product deleted' };
  }

  // Variant methods
  async addVariant(productId: string, dto: CreateVariantDto) {
    const product = await this.productRepository.findProductById(productId);
    if (!product) throw new NotFoundException('Product not found');
    const variant = await this.productRepository.createVariant(productId, dto);
    // Check low stock (if stock <= 5)
    if (dto.stockQuantity <= 5) {
      this.eventEmitter.emit(
        'product.lowStock',
        new LowStockEvent(variant.id, productId, dto.stockQuantity),
      );
    }
    return variant;
  }

  async updateVariant(variantId: string, dto: Partial<CreateVariantDto>) {
    const variant = await this.productRepository.findVariantById(variantId);
    if (!variant) throw new NotFoundException('Variant not found');
    const updated = await this.productRepository.updateVariant(variantId, dto);
    if (dto.stockQuantity !== undefined && dto.stockQuantity <= 5) {
      this.eventEmitter.emit(
        'product.lowStock',
        new LowStockEvent(variantId, variant.productId, dto.stockQuantity),
      );
    }
    return updated;
  }

  async deleteVariant(variantId: string) {
    const variant = await this.productRepository.findVariantById(variantId);
    if (!variant) throw new NotFoundException('Variant not found');
    await this.productRepository.deleteVariant(variantId);
    return { message: 'Variant deleted' };
  }

  async getVariants(productId: string) {
    return this.productRepository.findVariantsByProduct(productId);
  }
}
