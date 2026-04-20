import {
  Controller,
  Post,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
  Body,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { CloudinaryService } from '../../shared/infrastructure/cloudinary/cloudinary.service';
import { UploadFileDto } from './dto/upload-file.dto';
import { UploadMultipleDto } from './dto/upload-multiple.dto';
import { Public } from '../../common/decorators/public.decorator';

@Controller('upload')
export class UploadController {
  constructor(private readonly cloudinaryService: CloudinaryService) {}

  /**
   * Upload a single file (image, audio, video)
   */
  @Public()
  @Post('single')
  @UseInterceptors(FileInterceptor('file'))
  @HttpCode(HttpStatus.OK)
  async uploadSingle(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }), // 10MB
          new FileTypeValidator({ fileType: /(image\/|audio\/|video\/)/ }),
        ],
      }),
    )
    file: Express.Multer.File,
    @Body() dto: UploadFileDto,
  ) {
    const result = await this.cloudinaryService.uploadFile(file, {
      folder: dto.folder,
      resource_type: dto.resource_type,
    });
    return {
      url: result.secure_url,
      publicId: result.public_id,
      format: result.format,
      bytes: result.bytes,
      originalFilename: file.originalname,
    };
  }

  /**
   * Upload multiple files (max 5)
   */
  @Public()
  @Post('multiple')
  @UseInterceptors(FilesInterceptor('files', 5))
  @HttpCode(HttpStatus.OK)
  async uploadMultiple(
    @UploadedFiles(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }),
          new FileTypeValidator({ fileType: /(image\/|audio\/|video\/)/ }),
        ],
      }),
    )
    files: Express.Multer.File[],
    @Body() dto: UploadMultipleDto,
  ) {
    const results = await this.cloudinaryService.uploadMultipleFiles(files, {
      folder: dto.folder,
      resource_type: dto.resource_type,
    });
    return results.map((r) => ({
      url: r.secure_url,
      publicId: r.public_id,
      format: r.format,
      bytes: r.bytes,
    }));
  }
}