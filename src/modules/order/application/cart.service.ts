import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CartRepository } from '../domain/cart.repository.interface';
import { PrismaService } from '@/shared/infrastructure/database/prisma.service';
import { AddToCartDto } from './dto/add-to-cart.dto';

@Injectable()
export class CartService {
  constructor(
    @Inject('CartRepository') private cartRepository: CartRepository,
    private prisma: PrismaService,
  ) {}

  async getCart(userId: string) {
    const items = await this.cartRepository.getCart(userId);
    // Enrich with product details
    const enriched = await Promise.all(
      items.map(async (item) => {
        const variant = await this.prisma.productVariant.findUnique({
          where: { id: item.variantId },
          include: { product: true },
        });
        if (!variant) return null;
        return {
          variantId: item.variantId,
          productName: variant.product.name,
          size: variant.size,
          color: variant.color,
          quantity: item.quantity,
          price: item.price,
          total: item.price * item.quantity,
        };
      }),
    );
    return enriched.filter(Boolean);
  }

  async addToCart(userId: string, dto: AddToCartDto) {
    const variant = await this.prisma.productVariant.findUnique({
      where: { id: dto.variantId },
    });
    if (!variant) throw new NotFoundException('Variant not found');
    if (variant.stockQuantity < dto.quantity)
      throw new Error('Insufficient stock');
    const price =
      variant.additionalPrice + (await this.getBasePrice(variant.productId));
    await this.cartRepository.addItem(
      userId,
      dto.variantId,
      dto.quantity,
      price,
    );
    return { message: 'Added to cart' };
  }

  private async getBasePrice(productId: string): Promise<number> {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });
    return product?.basePrice || 0;
  }

  async removeFromCart(userId: string, variantId: string) {
    await this.cartRepository.removeItem(userId, variantId);
    return { message: 'Removed from cart' };
  }

  async clearCart(userId: string) {
    await this.cartRepository.clearCart(userId);
  }
}
