import { Test, TestingModule } from '@nestjs/testing';
import { UploadController } from './upload.controller';
import { CloudinaryService } from '../../shared/infrastructure/cloudinary/cloudinary.service';

describe('UploadController', () => {
  let controller: UploadController;
  let mockCloudinaryService: jest.Mocked<CloudinaryService>;

  beforeEach(async () => {
    mockCloudinaryService = {
      uploadFile: jest.fn(),
      uploadMultipleFiles: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UploadController],
      providers: [{ provide: CloudinaryService, useValue: mockCloudinaryService }],
    }).compile();

    controller = module.get<UploadController>(UploadController);
  });

  describe('uploadSingle', () => {
    it('should upload a single file and return metadata', async () => {
      const mockFile = { originalname: 'test.mp3', buffer: Buffer.from('') } as Express.Multer.File;
      const mockResult = {
        secure_url: 'https://res.cloudinary.com/audio.mp3',
        public_id: 'folder/audio123',
        format: 'mp3',
        bytes: 1024,
      };
      mockCloudinaryService.uploadFile.mockResolvedValue(mockResult as any);

      const result = await controller.uploadSingle(mockFile, { folder: 'audio', resource_type: 'auto' });
      expect(result).toEqual({
        url: mockResult.secure_url,
        publicId: mockResult.public_id,
        format: mockResult.format,
        bytes: mockResult.bytes,
        originalFilename: 'test.mp3',
      });
      expect(mockCloudinaryService.uploadFile).toHaveBeenCalledWith(mockFile, {
        folder: 'audio',
        resource_type: 'auto',
      });
    });
  });

  describe('uploadMultiple', () => {
    it('should upload multiple files', async () => {
      const mockFiles = [
        { originalname: 'a.mp3' } as Express.Multer.File,
        { originalname: 'b.mp3' } as Express.Multer.File,
      ];
      const mockResults = [
        { secure_url: 'url1', public_id: 'id1', format: 'mp3', bytes: 100 },
        { secure_url: 'url2', public_id: 'id2', format: 'mp3', bytes: 200 },
      ];
      mockCloudinaryService.uploadMultipleFiles.mockResolvedValue(mockResults as any);

      const result = await controller.uploadMultiple(mockFiles, { folder: 'audio' });
      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('url', 'url1');
      expect(mockCloudinaryService.uploadMultipleFiles).toHaveBeenCalledWith(mockFiles, {
        folder: 'audio',
        resource_type: 'auto',
      });
    });
  });
});