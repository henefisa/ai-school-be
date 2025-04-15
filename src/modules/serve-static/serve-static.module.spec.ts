import { Test, TestingModule } from '@nestjs/testing';
import { ServeStaticModule } from './serve-static.module';
import * as fs from 'fs';
import * as path from 'path';
import { uploadDirectories } from './serve-static.config';
import { FileStorageService } from '../../shared/services/file-storage.service';

describe('ServeStaticModule', () => {
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [ServeStaticModule],
      providers: [FileStorageService],
    }).compile();
  });

  it('should be defined', () => {
    expect(module).toBeDefined();
  });

  it('should create all configured upload directories', () => {
    // Arrange
    const expectedDirectories = uploadDirectories.map((dir) =>
      path.join(process.cwd(), dir.path),
    );

    // Act & Assert
    for (const directory of expectedDirectories) {
      expect(fs.existsSync(directory)).toBe(true);
    }
  });

  it('should have the correct number of upload directories', () => {
    // Arrange
    const expectedCount = uploadDirectories.length;

    // Act
    const actualDirectories = uploadDirectories.filter((dir) =>
      fs.existsSync(path.join(process.cwd(), dir.path)),
    );

    // Assert
    expect(actualDirectories.length).toBe(expectedCount);
  });

  it('should have valid route paths for all directories', () => {
    // Assert
    for (const directory of uploadDirectories) {
      expect(directory.route).toMatch(/^\/[\w-\/]+$/);
      expect(directory.path).toBeTruthy();
    }
  });
});
