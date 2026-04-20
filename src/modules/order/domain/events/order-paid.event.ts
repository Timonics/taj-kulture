export class OrderPaidEvent {
  constructor(
    public readonly orderId: string,
    public readonly userId: string,
    public readonly userEmail: string,
    public readonly totalAmount: number,
  ) {}
}