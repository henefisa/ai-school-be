import { Module, OnModuleInit, Logger } from '@nestjs/common';
import {
  ServeStaticModule as NestServeStaticModule,
  ServeStaticModuleOptions,
} from '@nestjs/serve-static';
import { join } from 'path';
import { uploadDirectories } from './serve-static.config';
import { FileStorageService } from './file-storage.service';
import { STATIC_FILE_CACHE_DURATION } from './serve-static.constants';

/**
 * Module for serving static files from upload directories.
 *
 * This module configures NestJS to serve static files from specified upload directories
 * and ensures these directories exist upon initialization.
 */
@Module({
  imports: [
    ...uploadDirectories
      .map(
        (directory): ServeStaticModuleOptions => ({
          rootPath: join(process.cwd(), directory.path),
          serveRoot: directory.route,
          serveStaticOptions: {
            index: false, // Do not serve index files by default
            fallthrough: true, // Allow other routes to handle if file not found
            maxAge: STATIC_FILE_CACHE_DURATION, // Set cache duration
          },
        }),
      )
      .map((options) => NestServeStaticModule.forRoot(options)),
  ],
  providers: [FileStorageService],
  exports: [FileStorageService],
})
export class ServeStaticModule implements OnModuleInit {
  private readonly logger = new Logger(ServeStaticModule.name);

  constructor(private readonly fileStorageService: FileStorageService) {}

  public onModuleInit(): void {
    this.ensureUploadDirectoriesExist();
  }

  private ensureUploadDirectoriesExist(): void {
    this.logger.log('Ensuring all upload directories exist...');
    uploadDirectories.forEach((directory) => {
      this.fileStorageService.ensureDirectoryExists(directory.path);
    });
    this.logger.log('Finished checking upload directories.');
  }
}
