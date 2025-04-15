import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/typeorm/entities/user.entity';
import { EntityManager, FindManyOptions, Repository } from 'typeorm';
import { GetUsersDto } from './dto/get-users.dto';
import { BaseService } from 'src/shared/base.service';
import { EntityName, ERROR_MESSAGES } from 'src/shared/error-messages';
import { CreateUserDto } from './dto/create-users.dto';
import { ExistsException } from 'src/shared/exceptions/exists.exception';
import { FileStorageService } from '../serve-static/file-storage.service';
import * as path from 'path';
import { uploadDirectories } from '../serve-static/serve-static.config';

@Injectable()
export class UsersService extends BaseService<User> {
  private readonly logger: Logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly fileStorageService: FileStorageService,
  ) {
    super(EntityName.User, userRepository);
  }

  /**
   * Checks if a username is available, optionally excluding a specific user ID.
   * Throws ExistsException if the username is taken by another user.
   * @param username - The username to check.
   * @param userId - Optional user ID to exclude from the check.
   * @returns True if the username is available.
   */
  async isUsernameAvailable(
    username: string,
    userId?: string,
  ): Promise<boolean> {
    const user = await this.userRepository.findOne({
      where: { username },
    });

    if (user && user.id !== userId) {
      // Throw specific error for username
      throw new ExistsException(EntityName.User); // Default message implies username
    }

    return true;
  }

  /**
   * Checks if an email is available, optionally excluding a specific user ID.
   * Throws ExistsException if the email is taken by another user.
   * @param email - The email to check.
   * @param userId - Optional user ID to exclude from the check.
   * @returns True if the email is available.
   */
  async isEmailAvailable(email: string, userId?: string): Promise<boolean> {
    const user = await this.userRepository.findOne({
      where: { email },
    });

    if (user && user.id !== userId) {
      // Throw specific error for email - using default message for now
      // Consider customizing ExistsException or using a different exception if needed
      throw new ExistsException(EntityName.User);
    }

    return true;
  }

  /**
   * Retrieves multiple users based on the provided options.
   * @param options - TypeORM find options.
   * @returns A promise resolving to an array of users.
   */
  async getMany(options: FindManyOptions<User>): Promise<User[]> {
    return this.userRepository.find(options);
  }

  /**
   * Creates a new user.
   * Checks for username and email availability before creation.
   * @param createUserDto - Data for creating the user.
   * @param entityManager - Optional TypeORM entity manager for transactions.
   * @returns A promise resolving to the created user.
   */
  async create(
    createUserDto: CreateUserDto,
    entityManager?: EntityManager,
  ): Promise<User> {
    await this.isUsernameAvailable(createUserDto.username);
    // Only check email if it's provided
    if (createUserDto.email) {
      await this.isEmailAvailable(createUserDto.email);
    }

    const user = this.userRepository.create(createUserDto);
    const manager = this.getRepository(entityManager);

    return manager.save(user);
  }

  /**
   * Finds all users based on pagination and filtering criteria.
   * @param dto - DTO containing pagination and filter options.
   * @returns A promise resolving to an object with results and count.
   */
  async findAll(dto: GetUsersDto): Promise<{ results: User[]; count: number }> {
    const [results, count] = await this.userRepository.findAndCount({
      where: {
        role: dto.role,
      },
      skip: (dto.page ?? 1 - 1) * (dto.pageSize ?? 10),
      take: dto.pageSize ?? 10,
    });

    return {
      results,
      count,
    };
  }

  /**
   * Updates a user's information.
   * Checks for username and email availability if they are being changed.
   * @param id - The ID of the user to update.
   * @param updateData - The partial data to update the user with.
   * @param entityManager - Optional TypeORM entity manager for transactions.
   * @returns A promise resolving to the updated user.
   */
  async update(
    id: string,
    updateData: Partial<User>,
    entityManager?: EntityManager,
  ): Promise<User> {
    const user = await this.getOneOrThrow({
      where: { id },
    });

    // If username is being updated, check if it's available
    if (updateData.username && updateData.username !== user.username) {
      await this.isUsernameAvailable(updateData.username, id);
    }

    // If email is being updated, check if it's available
    if (updateData.email && updateData.email !== user.email) {
      await this.isEmailAvailable(updateData.email, id);
    }

    // Update user fields
    Object.assign(user, updateData);

    // Save using either provided entity manager or repository
    const manager = this.getRepository(entityManager);
    return manager.save(user);
  }

  /**
   * Updates the avatar for a specific user.
   * @param userId - The ID of the user to update.
   * @param file - The uploaded avatar file.
   * @returns The updated User entity.
   */
  async updateAvatar(userId: string, file: Express.Multer.File): Promise<User> {
    const user = await this.getOneOrThrow({ where: { id: userId } });

    if (!file) {
      throw new BadRequestException('Avatar file is required.');
    }

    // --- File Validation (already handled by ParseFilePipe in controller, but good practice) ---
    // Example: Check file type and size again if needed, though pipes are preferred
    // const maxFileSize = 2 * 1024 * 1024; // 2MB
    // const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif'];
    // if (file.size > maxFileSize) {
    //   throw new BadRequestException(`File size exceeds the limit of ${maxFileSize / 1024 / 1024}MB.`);
    // }
    // if (!allowedMimeTypes.includes(file.mimetype)) {
    //   throw new BadRequestException(`Invalid file type. Only ${allowedMimeTypes.join(', ')} are allowed.`);
    // }
    // --- End File Validation ---

    const avatarConfig = uploadDirectories.find((dir) =>
      dir.path.includes('avatars'),
    );
    if (!avatarConfig) {
      this.logger.error('Avatar upload directory configuration not found.');
      throw new InternalServerErrorException(
        'Server configuration error for avatars.',
      );
    }
    const uploadDirectory = avatarConfig.path;
    const serveRoute = avatarConfig.route;

    // Generate a unique filename (e.g., userId-timestamp.ext)
    const timestamp = Date.now();
    const extension = path.extname(file.originalname);
    const filename = `${userId}-${timestamp}${extension}`;

    // 1. Delete old avatar if exists
    if (user.photoUrl) {
      try {
        // Extract filename from URL (assuming URL format /uploads/avatars/filename.ext)
        const oldFilename = path.basename(
          new URL(user.photoUrl, 'http://dummy.base').pathname,
        );
        if (oldFilename) {
          const deleteResult = this.fileStorageService.deleteFile(
            oldFilename,
            uploadDirectory,
          );
          if (
            !deleteResult.success &&
            deleteResult.error !== `File does not exist: ${deleteResult.path}`
          ) {
            // Log error but don't necessarily stop the process
            this.logger.warn(
              `Failed to delete old avatar ${oldFilename}: ${deleteResult.error}`,
            );
          }
        }
      } catch (error) {
        this.logger.warn(
          `Error processing old avatar URL ${user.photoUrl} for deletion: ${error instanceof Error ? error.message : error}`,
        );
      }
    }

    // 2. Save the new avatar
    const saveResult = this.fileStorageService.saveFile(
      file.buffer,
      filename,
      uploadDirectory,
    );

    if (!saveResult.success) {
      this.logger.error(`Failed to save avatar: ${saveResult.error}`);
      throw new InternalServerErrorException('Failed to save avatar file.');
    }

    // 3. Generate the URL for the saved file
    // Assuming file is served directly from the route defined in serve-static.config
    // Construct URL relative to the server root
    const photoUrl = `${serveRoute}/${filename}`.replace(/\/+/g, '/');

    // 4. Update user entity
    user.photoUrl = photoUrl;

    try {
      await this.userRepository.save(user);
      this.logger.log(`Updated avatar for user ${userId}`);
      return user;
    } catch (error) {
      // If saving user fails, try to delete the newly uploaded file
      this.fileStorageService.deleteFile(filename, uploadDirectory);
      this.logger.error(
        `Failed to update user ${userId} after saving avatar: ${error instanceof Error ? error.message : error}`,
      );
      throw new InternalServerErrorException(
        ERROR_MESSAGES.badRequest(EntityName.User), // Use badRequest for general update failure
      );
    }
  }
}
