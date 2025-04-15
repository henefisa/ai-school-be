import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Interface for file operation results
 */
export interface FileOperationResult {
  /** Whether the operation was successful */
  success: boolean;
  /** Optional error message if the operation failed */
  error?: string;
  /** Optional path to the file or directory */
  path?: string;
}

/**
 * Options for file URL generation
 */
export interface FileUrlOptions {
  /** Base URL path where the file is served */
  basePath: string;
  /** Whether to include the full domain in the URL */
  includeFullDomain?: boolean;
  /** Domain to use if includeFullDomain is true */
  domain?: string;
}

/**
 * Service for handling file storage operations
 *
 * This service provides methods for common file operations like
 * saving, deleting, and generating URLs for uploaded files.
 */
@Injectable()
export class FileStorageService {
  private readonly logger = new Logger(FileStorageService.name);

  /**
   * Deletes a file from the specified directory
   *
   * @param filename - The name of the file to delete
   * @param directory - The directory containing the file
   * @returns Result object with success status and error message if applicable
   */
  public deleteFile(filename: string, directory: string): FileOperationResult {
    try {
      const filePath = path.join(process.cwd(), directory, filename);

      if (!fs.existsSync(filePath)) {
        return {
          success: false,
          error: `File does not exist: ${filePath}`,
          path: filePath,
        };
      }

      fs.unlinkSync(filePath);
      this.logger.log(`Deleted file: ${filePath}`);

      return {
        success: true,
        path: filePath,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `Error deleting file: ${filename} from ${directory}`,
        error instanceof Error ? error.stack : undefined,
      );

      return {
        success: false,
        error: errorMessage,
        path: path.join(process.cwd(), directory, filename),
      };
    }
  }

  /**
   * Generates a URL for an uploaded file
   *
   * @param file - The uploaded file object
   * @param options - Options for URL generation
   * @returns The URL for the file or undefined if the file is invalid
   */
  public getFileUrl(
    file?: Express.Multer.File,
    options: FileUrlOptions = { basePath: '' },
  ): string | undefined {
    if (!file) {
      return undefined;
    }

    if (typeof file === 'object' && file !== null && 'filename' in file) {
      const urlPath = `${options.basePath}/${file.filename}`.replace(
        /\/+/g,
        '/',
      );

      if (options.includeFullDomain && options.domain) {
        return `${options.domain}${urlPath}`;
      }

      return urlPath;
    }

    return undefined;
  }

  /**
   * Creates a directory if it doesn't exist
   *
   * @param directoryPath - The path of the directory to create
   * @returns Result object with success status and error message if applicable
   */
  public ensureDirectoryExists(directoryPath: string): FileOperationResult {
    try {
      const fullPath = path.join(process.cwd(), directoryPath);

      if (fs.existsSync(fullPath)) {
        return {
          success: true,
          path: fullPath,
        };
      }

      fs.mkdirSync(fullPath, { recursive: true });
      this.logger.log(`Created directory: ${directoryPath}`);

      return {
        success: true,
        path: fullPath,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `Failed to create directory: ${directoryPath}`,
        error instanceof Error ? error.stack : undefined,
      );

      return {
        success: false,
        error: errorMessage,
        path: path.join(process.cwd(), directoryPath),
      };
    }
  }
}
