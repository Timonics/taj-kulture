import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import * as crypto from 'crypto';

@Injectable()
export class PaystackService {
  private readonly secretKey: string;
  private readonly baseUrl = 'https://api.paystack.co';

  constructor(
    private httpService: HttpService,
    private config: ConfigService,
  ) {
    this.secretKey = this.config.get('paystack.secretKey')!;
  }

  async initializeTransaction(
    orderId: string,
    amount: number,
    email: string,
    callbackUrl: string,
  ) {
    const response = await firstValueFrom(
      this.httpService.post(
        `${this.baseUrl}/transaction/initialize`,
        {
          amount: Math.round(amount * 100), // kobo
          email,
          reference: `TAJ-${orderId}-${Date.now()}`,
          callback_url: callbackUrl,
          metadata: { orderId },
        },
        {
          headers: { Authorization: `Bearer ${this.secretKey}` },
        },
      ),
    );
    return response.data.data.authorization_url;
  }

  verifyWebhookSignature(rawBody: string, signature: string): boolean {
    const hash = crypto
      .createHmac('sha512', this.secretKey)
      .update(rawBody)
      .digest('hex');
    return hash === signature;
  }
}
