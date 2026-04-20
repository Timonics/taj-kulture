export class OrderCreatedEvent {
  constructor(
    public readonly orderId: string,
    public readonly userId: string,
    public readonly userEmail: string,
    public readonly totalAmount: number,
    public readonly items: Array<{
      variantId: string;
      quantity: number;
      price: number;
    }>,
  ) {}
}
