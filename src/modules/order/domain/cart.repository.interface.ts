export interface CartItem {
  variantId: string;
  quantity: number;
  price: number; // snapshot price
}

export interface CartRepository {
  getCart(userId: string): Promise<CartItem[]>;
  addItem(
    userId: string,
    variantId: string,
    quantity: number,
    price: number,
  ): Promise<void>;
  removeItem(userId: string, variantId: string): Promise<void>;
  updateQuantity(
    userId: string,
    variantId: string,
    quantity: number,
  ): Promise<void>;
  clearCart(userId: string): Promise<void>;
}
