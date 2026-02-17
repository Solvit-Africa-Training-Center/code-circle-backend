import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';

@Injectable()
export class CloudinaryService {
  private readonly logger = new Logger(CloudinaryService.name);
  private isConfigured = false;

  constructor(private readonly configService: ConfigService) {
  
  }

  private ensureConfigured(): void {
    if (this.isConfigured) {
      return;
    }

    const cloudName = this.configService.get<string>('CLOUDINARY_CLOUD_NAME');
    const apiKey = this.configService.get<string>('CLOUDINARY_API_KEY');
    const apiSecret = this.configService.get<string>('CLOUDINARY_API_SECRET');

    if (!cloudName || !apiKey || !apiSecret) {
      this.logger.error(
        'Cloudinary environment variables are missing. Please check your .env file.',
      );
      this.logger.error(
        'Required variables: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET',
      );
      throw new BadRequestException(
        'Cloudinary configuration is incomplete. Please check your environment variables.',
      );
    }

    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
    });

    this.isConfigured = true;
  }

  /**
   * Upload a file to Cloudinary
   * @param file 
   * @param folder 
   * @param resourceType 
   */
  async uploadFile(
    file: Buffer | string,
    folder: string,
    resourceType: 'image' | 'raw' | 'video' | 'auto' = 'raw',
  ): Promise<string> {
    this.ensureConfigured();
    try {
      const uploadOptions: any = {
        folder,
        resource_type: resourceType,
        use_filename: true,
        unique_filename: true,
      };

      let uploadResult;
      if (Buffer.isBuffer(file)) {
        uploadResult = await cloudinary.uploader.upload(
          `data:application/pdf;base64,${file.toString('base64')}`,
          uploadOptions,
        );
      } else {
        uploadResult = await cloudinary.uploader.upload(file, uploadOptions);
      }

      this.logger.log(
        `File uploaded to Cloudinary: ${uploadResult.secure_url}`,
      );
      return uploadResult.secure_url;
    } catch (error) {
      this.logger.error(`Failed to upload file to Cloudinary: ${error.message}`);
      throw new BadRequestException('Failed to upload file');
    }
  }

  /**
   * Upload a file from base64 string
   */
  async uploadFromBase64(
    base64String: string,
    folder: string,
    resourceType: 'image' | 'raw' | 'video' | 'auto' = 'raw',
  ): Promise<string> {
    this.ensureConfigured();
    try {
      const uploadResult = await cloudinary.uploader.upload(base64String, {
        folder,
        resource_type: resourceType,
        use_filename: true,
        unique_filename: true,
      });

      this.logger.log(
        `File uploaded to Cloudinary: ${uploadResult.secure_url}`,
      );
      return uploadResult.secure_url;
    } catch (error) {
      this.logger.error(`Failed to upload file to Cloudinary: ${error.message}`);
      throw new BadRequestException('Failed to upload file');
    }
  }

  /**
   * Upload a file from Express Multer file object
   * @param file 
   * @param folder 
   * @param resourceType 
   */
  async uploadMulterFile(
    file: Express.Multer.File,
    folder: string,
    resourceType: 'image' | 'raw' | 'video' | 'auto' = 'raw',
  ): Promise<string> {
    this.ensureConfigured();
    try {
      if (!file) {
        throw new BadRequestException('No file provided');
      }

      // Validate file type (PDF for CV and degree)
      if (resourceType === 'raw' && file.mimetype !== 'application/pdf') {
        throw new BadRequestException('Only PDF files are allowed for CV and degree');
      }

      const uploadOptions: any = {
        folder,
        resource_type: resourceType,
        use_filename: true,
        unique_filename: true,
        filename_override: file.originalname,
      };

      // Convert buffer to data URI for Cloudinary
      const dataUri = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
      
      const uploadResult = await cloudinary.uploader.upload(dataUri, uploadOptions);

      this.logger.log(
        `File uploaded to Cloudinary: ${uploadResult.secure_url}`,
      );
      return uploadResult.secure_url;
    } catch (error) {
      this.logger.error(`Failed to upload file to Cloudinary: ${error.message}`);
      throw new BadRequestException(
        error instanceof BadRequestException ? error.message : 'Failed to upload file',
      );
    }
  }

  /**
   * Delete a file from Cloudinary
   */
  async deleteFile(publicId: string): Promise<void> {
    this.ensureConfigured();
    try {
      await cloudinary.uploader.destroy(publicId);
      this.logger.log(`File deleted from Cloudinary: ${publicId}`);
    } catch (error) {
      this.logger.error(
        `Failed to delete file from Cloudinary: ${error.message}`,
      );
      throw new BadRequestException('Failed to delete file');
    }
  }
}