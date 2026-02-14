import {
  Controller,
  Post,
  UploadedFiles,
  HttpCode,
  HttpStatus,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { UploadImagesService, UploadResult } from './upload-images.service';

@Controller('upload-images')
export class UploadImagesController {
  constructor(private readonly uploadImagesService: UploadImagesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FilesInterceptor('files'))
  async uploadImages(
    @UploadedFiles() files: Express.Multer.File[],
  ): Promise<{ message: string; files: UploadResult[] }> {
    const results = await this.uploadImagesService.uploadImages(files);

    const newCount = results.filter((r) => !r.isDuplicate).length;
    const dupCount = results.filter((r) => r.isDuplicate).length;

    let message = `Successfully processed ${results.length} file(s)`;
    if (dupCount > 0) {
      message += ` (${newCount} new, ${dupCount} duplicate${dupCount > 1 ? 's' : ''} reused)`;
    }

    return { message, files: results };
  }
}
