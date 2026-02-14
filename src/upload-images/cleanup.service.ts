import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { v2 as cloudinary } from 'cloudinary';
import { ImageEntity } from './entities/images.entity';

@Injectable()
export class CleanupService {
  private readonly logger = new Logger(CleanupService.name);

  constructor(
    @InjectRepository(ImageEntity)
    private readonly imageRepository: Repository<ImageEntity>,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async handleCleanup(): Promise<void> {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const expiredImages = await this.imageRepository.find({
      where: { createdAt: LessThan(cutoff) },
    });

    if (expiredImages.length === 0) {
      this.logger.log('Cleanup: no expired images found.');
      return;
    }

    let deletedCount = 0;
    let errorCount = 0;

    for (const image of expiredImages) {
      try {
        await cloudinary.uploader.destroy(image.cloudinaryPublicId);
        await this.imageRepository.remove(image);
        deletedCount++;
        this.logger.log(
          `Deleted expired image: ${image.cloudinaryPublicId} (original: ${image.originalName})`,
        );
      } catch (error) {
        errorCount++;
        this.logger.error(
          `Failed to delete image ${image.cloudinaryPublicId}: ${error}`,
        );
      }
    }

    this.logger.log(
      `Cleanup complete: ${deletedCount} image(s) deleted, ${errorCount} error(s)`,
    );
  }
}
