export class PaystackWebhookDto {
  event!: string;
  data!: {
    reference: string;
    status: string;
    amount: number;
    metadata?: {
      orderId?: string;
    };
  };
}
