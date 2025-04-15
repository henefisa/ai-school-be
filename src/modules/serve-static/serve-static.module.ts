import { Module, OnModuleInit, Logger } from '@nestjs/common';
import { ServeStaticModule as NestServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { uploadDirectories } from './serve-static.config';
import { ServeStaticModuleOptions } from '@nestjs/serve-static/dist/interfaces/serve-static-options.interface';
import { FileStorageService } from '../../shared/services/file-storage.service';
import { STATIC_FILE_CACHE_DURATION } from './serve-static.constants';

/**
 * Module for serving static files from upload directories.
 *
 * This module configures NestJS to serve static files from specified upload directories
 * and ensures these directories exist upon initialization.
 */
@Module({
  imports: [
    // Configure ServeStaticModule for each upload directory
    // Dynamically configure NestServeStaticModule for each upload directory
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
    // NOTE: Import SharedModule or ensure FileStorageService is globally available
    // Example: SharedModule,
  ],
  // FileStorageService is no longer provided or exported here
  // providers: [FileStorageService],
  // exports: [FileStorageService],
})
export class ServeStaticModule implements OnModuleInit {
  private readonly logger = new Logger(ServeStaticModule.name);

  // Inject FileStorageService (assuming it's available via DI)
  constructor(private readonly fileStorageService: FileStorageService) {}
  /**
   * Lifecycle hook called once the module has been initialized.
   * Ensures that all configured upload directories exist.
   */
  public onModuleInit(): void {
    this.ensureUploadDirectoriesExist();
  }

  /**
  /**
   * Iterates through configured upload directories and ensures each one exists.
   * Relies on FileStorageService to handle the creation and logging.
   */
  private ensureUploadDirectoriesExist(): void {
    this.logger.log('Ensuring all upload directories exist...');
    uploadDirectories.forEach((directory) => {
      // Let FileStorageService handle the logic and potential errors/logging
      this.fileStorageService.ensureDirectoryExists(directory.path);
    });
    this.logger.log('Finished checking upload directories.');
  }
}
