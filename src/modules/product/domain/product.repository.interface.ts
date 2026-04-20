import { Product, ProductVariant } from 'prisma-client';

export interface ProductRepository {
  // Product
  createProduct(data: any): Promise<Product>;
  updateProduct(productId: string, data: any): Promise<Product>;
  findProductById(id: string): Promise<Product | null>;
  findProductBySlug(slug: string): Promise<Product | null>;
  findProducts(filters: any, page: number, limit: number): Promise<Product[]>;
  countProducts(filters: any): Promise<number>;
  deleteProduct(productId: string): Promise<void>;

  // Variants
  createVariant(productId: string, data: any): Promise<ProductVariant>;
  updateVariant(variantId: string, data: any): Promise<ProductVariant>;
  findVariantById(variantId: string): Promise<ProductVariant | null>;
  findVariantsByProduct(productId: string): Promise<ProductVariant[]>;
  deleteVariant(variantId: string): Promise<void>;
}
