import { ConfigService } from '@nestjs/config';
import { ImageEntity } from 'src/upload-images/entities/images.entity';
import { DataSourceOptions } from 'typeorm';

export const getDatabaseConfig = (
  configService: ConfigService,
): DataSourceOptions => {
  const databaseUrl = configService.get<string>('DATABASE_URL');

  return {
    type: 'postgres',
    url: databaseUrl,
    entities: [ImageEntity],
    synchronize: true,
    logging: ['query', 'error'],
  };
};
