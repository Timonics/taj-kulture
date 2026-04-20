import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ProductService } from './application/product.service';
import { CreateProductDto } from './application/dto/create-product.dto';
import { UpdateProductDto } from './application/dto/update-product.dto';
import { CreateVariantDto } from './application/dto/create-variant.dto';
import { ProductQueryDto } from './application/dto/product-query.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { Public } from '@/common/decorators/public.decorator';

@Controller('products')
export class ProductController {
  constructor(private productService: ProductService) {}

  // Public endpoints
  @Public()
  @Get()
  async getProducts(@Query() query: ProductQueryDto) {
    return this.productService.getProducts(query);
  }

  @Public()
  @Get(':slug')
  async getProductBySlug(@Param('slug') slug: string) {
    return this.productService.getProductBySlug(slug);
  }

  @Public()
  @Get(':productId/variants')
  async getVariants(@Param('productId') productId: string) {
    return this.productService.getVariants(productId);
  }

  // Admin endpoints
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Post()
  async createProduct(@Body() dto: CreateProductDto) {
    return this.productService.createProduct(dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Put(':id')
  async updateProduct(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.productService.updateProduct(id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Delete(':id')
  async deleteProduct(@Param('id') id: string) {
    return this.productService.deleteProduct(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Post(':productId/variants')
  async addVariant(
    @Param('productId') productId: string,
    @Body() dto: CreateVariantDto,
  ) {
    return this.productService.addVariant(productId, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Put('variants/:variantId')
  async updateVariant(
    @Param('variantId') variantId: string,
    @Body() dto: Partial<CreateVariantDto>,
  ) {
    return this.productService.updateVariant(variantId, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Delete('variants/:variantId')
  async deleteVariant(@Param('variantId') variantId: string) {
    return this.productService.deleteVariant(variantId);
  }
}
