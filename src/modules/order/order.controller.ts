import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  Headers,
  Req,
} from '@nestjs/common';
import { CartService } from './application/cart.service';
import { OrderService } from './application/order.service';
import { AddToCartDto } from './application/dto/add-to-cart.dto';
import { CheckoutDto } from './application/dto/checkout.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Public } from '../../common/decorators/public.decorator';

@Controller('order')
export class OrderController {
  constructor(
    private cartService: CartService,
    private orderService: OrderService,
  ) {}

  // Cart endpoints
  @UseGuards(JwtAuthGuard)
  @Get('cart')
  async getCart(@Request() req) {
    return this.cartService.getCart(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('cart')
  async addToCart(@Request() req, @Body() dto: AddToCartDto) {
    return this.cartService.addToCart(req.user.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('cart/:variantId')
  async removeFromCart(@Request() req, @Param('variantId') variantId: string) {
    return this.cartService.removeFromCart(req.user.id, variantId);
  }

  // Checkout
  @UseGuards(JwtAuthGuard)
  @Post('checkout')
  async checkout(@Request() req, @Body() dto: CheckoutDto) {
    return this.orderService.checkout(req.user.id, dto);
  }

  // Paystack webhook (public)
  @Public()
  @Post('webhook/paystack')
  @HttpCode(HttpStatus.OK)
  async paystackWebhook(
    @Req() req: Request,
    @Headers('x-paystack-signature') signature: string,
  ) {
    // Get raw body as string (Express adds rawBody if using raw-parser middleware)
    // We need to ensure the body parser does not parse JSON for this route.
    // Alternative: use a custom decorator to get raw body.
    const rawBody = (req as any).rawBody || JSON.stringify(req.body);
    return this.orderService.handlePaystackWebhook(rawBody, signature);
  }
}
