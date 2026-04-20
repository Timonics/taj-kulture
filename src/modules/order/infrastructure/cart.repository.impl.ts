import { Injectable } from '@nestjs/common';
import { RedisService } from '../../../shared/infrastructure/redis/redis.service';
import { CartRepository, CartItem } from '../domain/cart.repository.interface';

@Injectable()
export class RedisCartRepository implements CartRepository {
  private readonly CART_PREFIX = 'cart:';

  constructor(private redisService: RedisService) {}

  private getKey(userId: string): string {
    return `${this.CART_PREFIX}${userId}`;
  }

  async getCart(userId: string): Promise<CartItem[]> {
    const data = await this.redisService.get(this.getKey(userId));
    return data ? JSON.parse(data) : [];
  }

  async addItem(
    userId: string,
    variantId: string,
    quantity: number,
    price: number,
  ): Promise<void> {
    const cart = await this.getCart(userId);
    const existing = cart.find((item) => item.variantId === variantId);
    if (existing) {
      existing.quantity += quantity;
    } else {
      cart.push({ variantId, quantity, price });
    }
    await this.redisService.set(this.getKey(userId), JSON.stringify(cart));
  }

  async removeItem(userId: string, variantId: string): Promise<void> {
    const cart = await this.getCart(userId);
    const filtered = cart.filter((item) => item.variantId !== variantId);
    await this.redisService.set(this.getKey(userId), JSON.stringify(filtered));
  }

  async updateQuantity(
    userId: string,
    variantId: string,
    quantity: number,
  ): Promise<void> {
    const cart = await this.getCart(userId);
    const item = cart.find((item) => item.variantId === variantId);
    if (item) {
      if (quantity <= 0) {
        await this.removeItem(userId, variantId);
      } else {
        item.quantity = quantity;
        await this.redisService.set(this.getKey(userId), JSON.stringify(cart));
      }
    }
  }

  async clearCart(userId: string): Promise<void> {
    await this.redisService.del(this.getKey(userId));
  }
}
