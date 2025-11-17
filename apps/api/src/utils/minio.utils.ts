import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Minio from 'minio';
import { v4 as uuidv4 } from 'uuid';

export interface FileUploadResult {
  success: boolean;
  s3Key: string;
  publicUrl: string;
  originalName: string;
}

export interface FileInfo {
  s3Key: string;
  name: string;
  size: number;
  lastModified: Date;
  etag: string;
  publicUrl: string;
}

export interface FileMetadata {
  contentType: string;
  size: number;
  lastModified: Date;
  publicUrl: string;
}

export type FileType = 'avatar' | 'secondaryAvatar' | 'banner' | 'resume' | 'certification' | 'application-letter' | 'message-attachment';

@Injectable()
export class MinioService implements OnModuleInit {
  private readonly logger = new Logger(MinioService.name);
  private minioClient: Minio.Client;
  private bucketName: string;
  private readonly basePublicPath = 'Public/users';

  constructor(private readonly configService: ConfigService) {
    this.bucketName = this.getRequiredConfig('MINIO_BUCKET_NAME');

    this.minioClient = new Minio.Client({
      endPoint: this.getRequiredConfig('MINIO_ENDPOINT'),
      accessKey: this.getRequiredConfig('MINIO_ACCESS_KEY'),
      secretKey: this.getRequiredConfig('MINIO_SECRET_KEY'),
    });
  }

  private getRequiredConfig(key: string): string {
    const value = this.configService.get<string>(key);
    if (!value) {
      throw new Error(`Missing required configuration: ${key}`);
    }
    return value;
  }

  async onModuleInit() {
    await this.ensureBucketExists();
  }

  async ensureBucketExists(): Promise<void> {
    try {
      const exists = await this.minioClient.bucketExists(this.bucketName);
      if (!exists) {
        await this.minioClient.makeBucket(this.bucketName);
        this.logger.log(`Bucket '${this.bucketName}' created successfully`);
      }
    } catch (error) {
      this.logger.error('Error ensuring bucket exists:', error);
      throw error;
    }
  }

  /**
   * Generate S3 key for user files based on file type
   * @param userId - User ID
   * @param fileType - 'avatar', 'banner', or 'certification'
   * @param originalName - Original filename (for certifications)
   * @returns S3 key
   */
  private generateS3Key(
    userId: string,
    fileType: FileType,
    originalName?: string,
  ): string {
    const timestamp = Date.now();
    const getExtension = (filename) => {
      if (!filename) return '';
      const ext = filename.split('.').pop();
      return ext ? `.${ext}` : '';
    };

switch (fileType) {
  case 'avatar':
    const avatarExt = getExtension(originalName) || '.jpg'; // default to .jpg
    return `${this.basePublicPath}/${userId}/avatar${avatarExt}`;

  case 'secondaryAvatar': 
    const secondaryAvatarExt = getExtension(originalName) || '.jpg';
    return `${this.basePublicPath}/${userId}/secondary-avatar${secondaryAvatarExt}`;

  case 'banner':
    const bannerExt = getExtension(originalName) || '.jpg'; // default to .jpg
    return `${this.basePublicPath}/${userId}/banner${bannerExt}`;

  case 'resume':
    const resumeExt = getExtension(originalName) || '.pdf'; // default to .pdf
    return `${this.basePublicPath}/${userId}/resume${resumeExt}`;

  case 'application-letter':
    const applicationLetterExt = getExtension(originalName) || '.pdf'; // default to .pdf
    return `${this.basePublicPath}/${userId}/application-letter${applicationLetterExt}`;

  case 'certification':
    const uuid = uuidv4().split('-')[0];
    const certExt = getExtension(originalName) || '.pdf'; // default to .pdf
    return `${this.basePublicPath}/${userId}/certifications/${timestamp}-${uuid}${certExt}`;

  case 'message-attachment':
    const attachmentUuid = uuidv4().split('-')[0];
    const attachmentExt = getExtension(originalName);
    return `${this.basePublicPath}/${userId}/messages/${timestamp}-${attachmentUuid}${attachmentExt}`;

  default:
    throw new Error(`Unsupported file type: ${fileType}`);
}
  }

  /**
   * Upload file to S3 with proper folder structure
   * @param file - Multer file object
   * @param userId - User ID
   * @param fileType - 'avatar', 'banner', or 'certification'
   * @returns Upload result with S3 key and public URL
   */
  async uploadFile(
    file: Express.Multer.File,
    userId: string,
    fileType: FileType,
  ): Promise<FileUploadResult> {
    try {
      const s3Key = this.generateS3Key(userId, fileType, file.originalname);

      await this.minioClient.putObject(
        this.bucketName,
        s3Key,
        file.buffer,
        file.size,
        {
          'Content-Type': file.mimetype,
          'x-amz-acl': 'public-read', // Make object publicly accessible
        },
      );

      const publicUrl = this.getPublicUrl(s3Key);

      return {
        success: true,
        s3Key,
        publicUrl,
        originalName: file.originalname,
      };
    } catch (error) {
      this.logger.error('Error uploading file:', error);
      throw error;
    }
  }

  /**
   * List files for a specific user
   * @param userId - User ID
   * @param fileType - Optional: 'avatar', 'banner', 'certification'
   * @returns List of user files
   */
  async listUserFiles(
    userId: string,
    fileType?: FileType,
  ): Promise<FileInfo[]> {
    try {
      let prefix = `${this.basePublicPath}/${userId}/`;
      if (fileType === 'certification') {
        prefix += 'certifications/';
      }

      const stream = this.minioClient.listObjects(this.bucketName, prefix);
      const files: FileInfo[] = [];

      for await (const obj of stream) {
        files.push({
          s3Key: obj.name,
          name: obj.name.split('/').pop() || obj.name,
          size: obj.size,
          lastModified: obj.lastModified,
          etag: obj.etag,
          publicUrl: this.getPublicUrl(obj.name),
        });
      }

      return files;
    } catch (error) {
      this.logger.error('Error listing user files:', error);
      throw error;
    }
  }

  async listFiles(): Promise<FileInfo[]> {
    try {
      const stream = this.minioClient.listObjects(this.bucketName);
      const files: FileInfo[] = [];

      for await (const obj of stream) {
        files.push({
          s3Key: obj.name,
          name: obj.name.split('/').pop() || obj.name,
          size: obj.size,
          lastModified: obj.lastModified,
          etag: obj.etag,
          publicUrl: this.getPublicUrl(obj.name),
        });
      }

      return files;
    } catch (error) {
      this.logger.error('Error listing files:', error);
      throw error;
    }
  }

  async getFileInfo(s3Key: string): Promise<FileMetadata> {
    try {
      const stat = await this.minioClient.statObject(this.bucketName, s3Key);
      return {
        contentType:
          stat.metaData['content-type'] || 'application/octet-stream',
        size: stat.size,
        lastModified: stat.lastModified,
        publicUrl: this.getPublicUrl(s3Key),
      };
    } catch (error) {
      this.logger.error('Error getting file info:', error);
      throw error;
    }
  }

  async downloadFile(s3Key: string): Promise<NodeJS.ReadableStream> {
    try {
      const dataStream = await this.minioClient.getObject(
        this.bucketName,
        s3Key,
      );
      return dataStream;
    } catch (error) {
      this.logger.error('Error downloading file:', error);
      throw error;
    }
  }

  async deleteFile(s3Key: string): Promise<{ success: boolean }> {
    try {
      await this.minioClient.removeObject(this.bucketName, s3Key);
      return { success: true };
    } catch (error) {
      this.logger.error('Error deleting file:', error);
      throw error;
    }
  }

  /**
   * Delete all files for a user (useful for user cleanup)
   * @param userId - User ID
   * @returns Deletion result
   */
  async deleteUserFiles(
    userId: string,
  ): Promise<{ success: boolean; deletedCount: number }> {
    try {
      const files = await this.listUserFiles(userId);
      const deletePromises = files.map((file) => this.deleteFile(file.s3Key));
      await Promise.all(deletePromises);

      return {
        success: true,
        deletedCount: files.length,
      };
    } catch (error) {
      this.logger.error('Error deleting user files:', error);
      throw error;
    }
  }

  /**
   * Get public URL for a file
   * @param s3Key - The S3 key of the object
   */
  getPublicUrl(s3Key: string): string {
    const endPoint = this.getRequiredConfig('MINIO_ENDPOINT');
    return `https://${endPoint}/${this.bucketName}/${s3Key}`;
  }

  /**
   * Generate a presigned URL for temporary access to a file
   * @param s3Key - The S3 key of the object
   * @param expiry - Expiry time in seconds (default: 24 hours)
   */
  async getPresignedUrl(
    s3Key: string,
    expiry: number = 24 * 60 * 60,
  ): Promise<string> {
    try {
      const url = await this.minioClient.presignedGetObject(
        this.bucketName,
        s3Key,
        expiry,
      );
      return url;
    } catch (error) {
      this.logger.error('Error generating presigned URL:', error);
      throw error;
    }
  }

  /**
   * Generate a presigned PUT URL for direct upload from client
   * @param userId - User ID
   * @param fileType - Type of file being uploaded
   * @param originalName - Original filename
   * @param expiry - Expiry time in seconds (default: 15 minutes)
   * @returns Object with uploadUrl, fileKey, and publicUrl
   */
  async generatePresignedUploadUrl(
    userId: string,
    fileType: FileType,
    originalName: string,
    expiry: number = 15 * 60, // 15 minutes
  ): Promise<{ uploadUrl: string; fileKey: string; publicUrl: string }> {
    try {
      const fileKey = this.generateS3Key(userId, fileType, originalName);

      const uploadUrl = await this.minioClient.presignedPutObject(
        this.bucketName,
        fileKey,
        expiry,
      );

      const publicUrl = this.getPublicUrl(fileKey);

      return {
        uploadUrl,
        fileKey,
        publicUrl,
      };
    } catch (error) {
      this.logger.error('Error generating presigned upload URL:', error);
      throw error;
    }
  }
}
