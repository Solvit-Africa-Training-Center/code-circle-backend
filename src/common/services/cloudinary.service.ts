import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';

@Injectable()
export class CloudinaryService {
  private readonly logger = new Logger(CloudinaryService.name);

  constructor(private readonly configService: ConfigService) {
    cloudinary.config({
      cloud_name: this.configService.get<string>('CLOUDINARY_CLOUD_NAME'),
      api_key: this.configService.get<string>('CLOUDINARY_API_KEY'),
      api_secret: this.configService.get<string>('CLOUDINARY_API_SECRET'),
    });
  }

  /**
   * Upload a file to Cloudinary
   * @param file - File buffer or base64 string
   * @param folder - Folder path in Cloudinary (e.g., 'users/cv', 'users/degrees')
   * @param resourceType - Type of resource ('image', 'raw', 'video', 'auto')
   */
  async uploadFile(
    file: Buffer | string,
    folder: string,
    resourceType: 'image' | 'raw' | 'video' | 'auto' = 'raw',
  ): Promise<string> {
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
   * Delete a file from Cloudinary
   */
  async deleteFile(publicId: string): Promise<void> {
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

