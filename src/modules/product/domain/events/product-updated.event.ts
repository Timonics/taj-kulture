export class ProductUpdatedEvent {
  constructor(
    public readonly productId: string,
    public readonly changes: Record<string, any>,
  ) {}
}
