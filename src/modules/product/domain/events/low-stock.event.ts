export class LowStockEvent {
  constructor(
    public readonly variantId: string,
    public readonly productId: string,
    public readonly currentStock: number,
  ) {}
}
