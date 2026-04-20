import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import {
  v2 as CloudinaryAPI,
  UploadApiResponse,
  UploadApiErrorResponse,
} from 'cloudinary';
import streamifier from 'streamifier';
import { CLOUDINARY } from './cloudinary.provider';

export interface UploadOptions {
  folder?: string;
  resource_type?: 'image' | 'video' | 'raw' | 'auto';
  public_id?: string;
  allowed_formats?: string[];
  transformation?: any;
  [key: string]: any;
}

@Injectable()
export class CloudinaryService {
  constructor(@Inject(CLOUDINARY) private cloudinary: typeof CloudinaryAPI) {}

  /**
   * Upload a single file (image or audio) to Cloudinary
   * @param file - Express.Multer.File object
   * @param options - Upload options (folder, resource_type, etc.)
   */
  async uploadFile(
    file: Express.Multer.File,
    options: UploadOptions = {},
  ): Promise<UploadApiResponse | UploadApiErrorResponse> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const defaultOptions: UploadOptions = {
      folder: 'taj-kulture',
      resource_type: 'auto', // Let Cloudinary detect image vs audio vs video
      ...options,
    };

    return new Promise((resolve, reject) => {
      const uploadStream = this.cloudinary.uploader.upload_stream(
        defaultOptions,
        (error, result) => {
          if (error) return reject(error);
          resolve(result!);
        },
      );
      streamifier.createReadStream(file.buffer).pipe(uploadStream);
    });
  }

  /**
   * Upload multiple files concurrently
   * @param files - Array of Express.Multer.File objects
   * @param options - Upload options
   */
  async uploadMultipleFiles(
    files: Express.Multer.File[],
    options: UploadOptions = {},
  ): Promise<(UploadApiResponse | UploadApiErrorResponse)[]> {
    const uploadPromises = files.map((file) => this.uploadFile(file, options));
    return Promise.all(uploadPromises);
  }

  /**
   * Delete a file from Cloudinary by public_id
   * @param publicId - The public ID of the file
   */
  async deleteFile(publicId: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.cloudinary.uploader.destroy(publicId, (error, result) => {
        if (error) return reject(error);
        resolve(result);
      });
    });
  }

  /**
   * Get the public URL of a file
   * @param publicId - The public ID of the file
   * @param options - Transformations (e.g., { width: 500, height: 500, crop: 'fill' })
   */
  getFileUrl(publicId: string, options?: any): string {
    return this.cloudinary.url(publicId, options);
  }
}
