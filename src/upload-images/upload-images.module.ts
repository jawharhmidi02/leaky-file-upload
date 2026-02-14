import { Module } from '@nestjs/common';
import { UploadImagesController } from './upload-images.controller';
import { UploadImagesService } from './upload-images.service';
import { CleanupService } from './cleanup.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ImageEntity } from './entities/images.entity';
import { CloudinaryProvider } from '../config/cloudinary.provider';

@Module({
  imports: [TypeOrmModule.forFeature([ImageEntity])],
  controllers: [UploadImagesController],
  providers: [UploadImagesService, CleanupService, CloudinaryProvider],
  exports: [UploadImagesService],
})
export class UploadImagesModule {}
