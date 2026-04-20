import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/shared/infrastructure/database/prisma.service';
import { ProductRepository } from '../domain/product.repository.interface';
import { Product, ProductVariant } from 'prisma-client';

@Injectable()
export class PrismaProductRepository implements ProductRepository {
  constructor(private prisma: PrismaService) {}

  // Product methods
  async createProduct(data: any): Promise<Product> {
    return this.prisma.product.create({ data });
  }

  async updateProduct(productId: string, data: any): Promise<Product> {
    return this.prisma.product.update({ where: { id: productId }, data });
  }

  async findProductById(id: string): Promise<Product | null> {
    return this.prisma.product.findUnique({ where: { id } });
  }

  async findProductBySlug(slug: string): Promise<Product | null> {
    return this.prisma.product.findUnique({ where: { slug } });
  }

  async findProducts(
    filters: any,
    page: number,
    limit: number,
  ): Promise<Product[]> {
    const skip = (page - 1) * limit;
    return this.prisma.product.findMany({
      where: filters,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    });
  }

  async countProducts(filters: any): Promise<number> {
    return this.prisma.product.count({ where: filters });
  }

  async deleteProduct(productId: string): Promise<void> {
    await this.prisma.product.delete({ where: { id: productId } });
  }

  // Variant methods
  async createVariant(productId: string, data: any): Promise<ProductVariant> {
    return this.prisma.productVariant.create({
      data: { ...data, productId },
    });
  }

  async updateVariant(variantId: string, data: any): Promise<ProductVariant> {
    return this.prisma.productVariant.update({
      where: { id: variantId },
      data,
    });
  }

  async findVariantById(variantId: string): Promise<ProductVariant | null> {
    return this.prisma.productVariant.findUnique({ where: { id: variantId } });
  }

  async findVariantsByProduct(productId: string): Promise<ProductVariant[]> {
    return this.prisma.productVariant.findMany({ where: { productId } });
  }

  async deleteVariant(variantId: string): Promise<void> {
    await this.prisma.productVariant.delete({ where: { id: variantId } });
  }
}
