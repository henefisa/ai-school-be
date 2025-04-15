import { Test, TestingModule } from '@nestjs/testing';
import { FileStorageService } from './file-storage.service';
import * as fs from 'fs';
import * as path from 'path';

describe('FileStorageService', () => {
  let service: FileStorageService;
  const testDir = 'test-uploads';
  const testFilePath = path.join(process.cwd(), testDir, 'test-file.txt');

  beforeAll(() => {
    // Create test directory if it doesn't exist
    if (!fs.existsSync(path.join(process.cwd(), testDir))) {
      fs.mkdirSync(path.join(process.cwd(), testDir), { recursive: true });
    }
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FileStorageService],
    }).compile();

    service = module.get<FileStorageService>(FileStorageService);
  });

  afterAll(() => {
    // Clean up test directory
    if (fs.existsSync(path.join(process.cwd(), testDir))) {
      fs.rmSync(path.join(process.cwd(), testDir), {
        recursive: true,
        force: true,
      });
    }
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('ensureDirectoryExists', () => {
    it('should create a directory if it does not exist', () => {
      // Arrange
      const newDir = `${testDir}/new-dir`;
      const fullPath = path.join(process.cwd(), newDir);

      // Make sure directory doesn't exist before test
      if (fs.existsSync(fullPath)) {
        fs.rmSync(fullPath, { recursive: true, force: true });
      }

      // Act
      const result = service.ensureDirectoryExists(newDir);

      // Assert
      expect(result.success).toBe(true);
      expect(fs.existsSync(fullPath)).toBe(true);
      expect(result.path).toBe(fullPath);
    });

    it('should return success if directory already exists', () => {
      // Arrange - directory already created in beforeAll

      // Act
      const result = service.ensureDirectoryExists(testDir);

      // Assert
      expect(result.success).toBe(true);
      expect(result.path).toBe(path.join(process.cwd(), testDir));
    });
  });

  describe('getFileUrl', () => {
    it('should return undefined if file is undefined', () => {
      // Act
      const result = service.getFileUrl(undefined, { basePath: '/uploads' });

      // Assert
      expect(result).toBeUndefined();
    });

    it('should return a URL for a valid file', () => {
      // Arrange
      const mockFile = {
        filename: 'test-file.jpg',
        originalname: 'original.jpg',
        mimetype: 'image/jpeg',
        size: 1024,
        buffer: Buffer.from('test'),
        fieldname: 'photo',
        encoding: '7bit',
        destination: '/uploads',
        path: '/uploads/test-file.jpg',
      } as Express.Multer.File;

      // Act
      const result = service.getFileUrl(mockFile, { basePath: '/uploads' });

      // Assert
      expect(result).toBe('/uploads/test-file.jpg');
    });

    it('should include domain when includeFullDomain is true', () => {
      // Arrange
      const mockFile = {
        filename: 'test-file.jpg',
        originalname: 'original.jpg',
        mimetype: 'image/jpeg',
        size: 1024,
        buffer: Buffer.from('test'),
        fieldname: 'photo',
        encoding: '7bit',
        destination: '/uploads',
        path: '/uploads/test-file.jpg',
      } as Express.Multer.File;

      // Act
      const result = service.getFileUrl(mockFile, {
        basePath: '/uploads',
        includeFullDomain: true,
        domain: 'https://example.com',
      });

      // Assert
      expect(result).toBe('https://example.com/uploads/test-file.jpg');
    });
  });

  describe('deleteFile', () => {
    it('should delete a file if it exists', () => {
      // Arrange
      fs.writeFileSync(testFilePath, 'test content');

      // Act
      const result = service.deleteFile('test-file.txt', testDir);

      // Assert
      expect(result.success).toBe(true);
      expect(fs.existsSync(testFilePath)).toBe(false);
      expect(result.path).toBe(testFilePath);
    });

    it('should return failure if file does not exist', () => {
      // Act
      const result = service.deleteFile('non-existent-file.txt', testDir);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('does not exist');
    });
  });

  describe('saveFile', () => {
    it('should save a file to the specified directory', () => {
      // Arrange
      const filename = 'saved-file.txt';
      const content = Buffer.from('test content');
      const filePath = path.join(process.cwd(), testDir, filename);

      // Make sure file doesn't exist before test
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      // Act
      const result = service.saveFile(content, filename, testDir);

      // Assert
      expect(result.success).toBe(true);
      expect(fs.existsSync(filePath)).toBe(true);
      expect(fs.readFileSync(filePath).toString()).toBe('test content');
      expect(result.path).toBe(filePath);
    });

    it('should create the directory if it does not exist', () => {
      // Arrange
      const newDir = `${testDir}/new-dir-2`;
      const filename = 'saved-file.txt';
      const content = Buffer.from('test content');
      const filePath = path.join(process.cwd(), newDir, filename);

      // Make sure directory doesn't exist before test
      if (fs.existsSync(path.join(process.cwd(), newDir))) {
        fs.rmSync(path.join(process.cwd(), newDir), {
          recursive: true,
          force: true,
        });
      }

      // Act
      const result = service.saveFile(content, filename, newDir);

      // Assert
      expect(result.success).toBe(true);
      expect(fs.existsSync(filePath)).toBe(true);
      expect(fs.readFileSync(filePath).toString()).toBe('test content');
      expect(result.path).toBe(filePath);
    });
  });
});
