import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { STORAGE_DRIVER, StorageDriver } from './storage.interface';
import { LocalDriver } from './drivers/local.driver';
import { R2Driver } from './drivers/r2.driver';
import { ImageProcessorService } from './image-processor.service';
import { UploadsService } from './uploads.service';
import { UploadsController } from './uploads.controller';

@Module({
  imports: [ConfigModule],
  controllers: [UploadsController],
  providers: [
    ImageProcessorService,
    {
      provide: STORAGE_DRIVER,
      inject: [ConfigService],
      useFactory: (config: ConfigService): StorageDriver => {
        const driver = config.get<string>('STORAGE_DRIVER') || 'local';
        if (driver === 'r2') {
          return new R2Driver(config);
        }
        return new LocalDriver(config);
      },
    },
    UploadsService,
  ],
  exports: [UploadsService, ImageProcessorService],
})
export class UploadsModule {}
