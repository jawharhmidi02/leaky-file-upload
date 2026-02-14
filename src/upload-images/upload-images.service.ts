import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v2 as cloudinary } from 'cloudinary';
import * as crypto from 'crypto';
import { ImageEntity } from './entities/images.entity';

export interface UploadResult {
  originalName: string;
  storedName: string;
  url: string;
  size: number;
  mimeType: string;
  isDuplicate: boolean;
}

@Injectable()
export class UploadImagesService {
  private readonly logger = new Logger(UploadImagesService.name);
  private readonly allowedMimeTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
  ];

  constructor(
    @InjectRepository(ImageEntity)
    private readonly imageRepository: Repository<ImageEntity>,
  ) {}

  verifyFileType(mimeType: string): boolean {
    return this.allowedMimeTypes.includes(mimeType);
  }

  verifyFileSize(size: number): boolean {
    return size <= 5 * 1024 * 1024;
  }

  computeHash(buffer: Buffer): string {
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }

  async checkForDuplicate(hash: string): Promise<ImageEntity | null> {
    return this.imageRepository.findOne({ where: { hash } });
  }

  private uploadToCloudinary(
    buffer: Buffer,
    folder: string,
  ): Promise<{ secure_url: string; public_id: string }> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder, resource_type: 'image' },
        (error, result) => {
          if (error) return reject(error);
          resolve({
            secure_url: result!.secure_url,
            public_id: result!.public_id,
          });
        },
      );
      uploadStream.end(buffer);
    });
  }

  async uploadImages(files: Express.Multer.File[]): Promise<UploadResult[]> {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files provided');
    }

    const results: UploadResult[] = [];

    for (const file of files) {
      if (!this.verifyFileType(file.mimetype)) {
        throw new BadRequestException(
          `Unsupported file type: ${file.mimetype}. Allowed types: ${this.allowedMimeTypes.join(', ')}`,
        );
      }

      if (!this.verifyFileSize(file.size)) {
        throw new BadRequestException(
          `File "${file.originalname}" exceeds the 5MB size limit`,
        );
      }

      const hash = this.computeHash(file.buffer);

      const existing = await this.checkForDuplicate(hash);

      if (existing) {
        this.logger.log(
          `Duplicate detected: ${file.originalname} → ${existing.cloudinaryPublicId}`,
        );

        results.push({
          originalName: file.originalname,
          storedName: existing.cloudinaryPublicId,
          url: existing.url,
          size: existing.size,
          mimeType: existing.mimeType,
          isDuplicate: true,
        });
        continue;
      }

      const { secure_url, public_id } = await this.uploadToCloudinary(
        file.buffer,
        'uploads',
      );

      const image = this.imageRepository.create({
        originalName: file.originalname,
        hash,
        url: secure_url,
        cloudinaryPublicId: public_id,
        size: file.size,
        mimeType: file.mimetype,
      });
      await this.imageRepository.save(image);

      this.logger.log(
        `Uploaded new file: ${public_id} (original: ${file.originalname})`,
      );

      results.push({
        originalName: file.originalname,
        storedName: public_id,
        url: secure_url,
        size: file.size,
        mimeType: file.mimetype,
        isDuplicate: false,
      });
    }

    return results;
  }
}
