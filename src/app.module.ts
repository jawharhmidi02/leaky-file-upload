import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { UploadImagesModule } from './upload-images/upload-images.module';
import { ConfigModule } from '@nestjs/config';
import { ConnectModule } from './config/connect.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({ isGlobal: true }),
    UploadImagesModule,
    ConnectModule,
  ],
})
export class AppModule {}
