import { Module, OnModuleInit, Logger } from '@nestjs/common';
import { ServeStaticModule as NestServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { uploadDirectories } from './serve-static.config';
import { ServeStaticModuleOptions } from '@nestjs/serve-static/dist/interfaces/serve-static-options.interface';
import { FileStorageService } from '../../shared/services/file-storage.service';
import { STATIC_FILE_CACHE_DURATION } from './serve-static.constants';

/**
 * Module for serving static files from upload directories
 *
 * This module configures NestJS to serve static files from specified upload directories.
 * It also ensures that the directories exist, creating them if necessary.
 */
@Module({
  imports: [
    // Configure ServeStaticModule for each upload directory
    ...uploadDirectories
      .map(
        (directory): ServeStaticModuleOptions => ({
          rootPath: join(process.cwd(), directory.path),
          serveRoot: directory.route,
          serveStaticOptions: {
            index: false, // Don't serve index files
            fallthrough: true, // Continue to the next middleware if file not found
            maxAge: STATIC_FILE_CACHE_DURATION,
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

  /**
   * Lifecycle hook that runs when the module is initialized
   * Creates the upload directories if they don't exist
   */
  onModuleInit(): void {
    this.createUploadDirectories();
  }

  /**
   * Creates all configured upload directories if they don't exist
   */
  private createUploadDirectories(): void {
    uploadDirectories.forEach((directory) => {
      const result = this.fileStorageService.ensureDirectoryExists(
        directory.path,
      );

      if (result.success) {
        this.logger.log(`Ensured upload directory exists: ${directory.path}`);
      } else {
        this.logger.error(
          `Failed to ensure upload directory: ${directory.path}. Error: ${result.error}`,
        );
      }
    });
  }
}
