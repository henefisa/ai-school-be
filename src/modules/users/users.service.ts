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
import { uploadDirectories } from '../serve-static/serve-static.config';
import { Role } from 'src/shared/constants';
import { NotFoundException } from '@nestjs/common';

@Injectable()
export class UsersService extends BaseService<User> {
  private readonly logger: Logger = new Logger(UsersService.name);
  private readonly uploadsDirectory = 'uploads/avatars';

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
    if (!file) {
      throw new BadRequestException('Avatar file is required.');
    }

    const user = await this.getOneOrThrow({ where: { id: userId } });
    const avatarConfig = uploadDirectories.find((dir) =>
      dir.path.includes('avatars'),
    );
    if (!avatarConfig) {
      this.logger.error('Avatar upload directory configuration not found.');
      throw new InternalServerErrorException(
        'Server configuration error for avatars.',
      );
    }
    const serveRoute = avatarConfig.route;

    // Delete old avatar if it exists
    if (user.photoUrl) {
      this.logger.log(`Attempting to delete old avatar: ${user.photoUrl}`);

      const filename = user.photoUrl.split('/').pop();

      if (filename) {
        this._deleteUploadedFile(filename);
      }
    }

    if (!file.filename) {
      this.logger.error(
        'Multer did not provide a filename. Cannot proceed with avatar update.',
        file,
      );
      throw new InternalServerErrorException(
        'File processing failed: filename missing.',
      );
    }

    const newFilename = file.filename;
    let savedFilename: string | undefined = newFilename;

    try {
      const photoUrl = `${serveRoute}/${newFilename}`.replace(/\/+/g, '/');
      user.photoUrl = photoUrl;
      await this.userRepository.save(user);
      this.logger.log(`Updated avatar for user ${userId} to ${photoUrl}`);
      savedFilename = undefined;

      return user;
    } catch (error) {
      if (savedFilename) {
        this.logger.warn(
          `Rolling back avatar upload for user ${userId} due to error. Deleting file: ${savedFilename}`,
        );

        this._deleteUploadedFile(newFilename);
      }

      this.logger.error(
        `Failed to update avatar for user ${userId}: ${error instanceof Error ? error.message : error}`,
      );

      if (
        error instanceof InternalServerErrorException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }

      throw new InternalServerErrorException(
        'An unexpected error occurred while updating the avatar.',
      );
    }
  }

  /**
   * Private helper to delete an uploaded file, logging warnings on failure.
   * @param filename - The name of the file to delete.
   */
  private _deleteUploadedFile(filename: string): void {
    const result = this.fileStorageService.deleteFile(
      filename,
      this.uploadsDirectory,
    );
    // Log warnings for cleanup failures, but don't throw an error

    if (
      !result.success &&
      result.error !== `File does not exist: ${result.path}` // Ignore "file not found" during cleanup
    ) {
      this.logger.warn(
        `Failed to delete uploaded file ${filename} from ${this.uploadsDirectory}: ${result.error}`,
      );
    }
  }
  /**
   * Retrieves the user's profile including role-specific details.
   * @param userId - The ID of the user to fetch.
   * @returns The user object with role-specific profile information.
   */
  async getProfile(userId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: {
        student: true,
        teacher: true,
        parent: true,
      },
    });

    if (!user) {
      throw new NotFoundException(ERROR_MESSAGES.notFound(EntityName.User));
    }

    // Base profile data from user entity
    const profile: {
      id: string;
      username: string;
      email: string;
      role: Role;
      photoUrl: string;
      isActive: boolean;
      lastLogin: Date | null;
      firstName: string | null;
      lastName: string | null;
      dob: Date | null;
      gender: string | null;
      phoneNumber: string | null;
    } = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      photoUrl: user.photoUrl,
      isActive: user.isActive,
      lastLogin: user.lastLogin,
      firstName: null,
      lastName: null,
      dob: null,
      gender: null,
      phoneNumber: null,
    };

    // Add role-specific profile information
    switch (user.role) {
      case Role.Student:
        if (user.student) {
          Object.assign(profile, {
            firstName: user.student.firstName,
            lastName: user.student.lastName,
            gender: user.student.gender,
            phoneNumber: user.student.contactNumber,
            dob: user.student.dob,
          });
        } else {
          this.logger.warn(`Student profile not found for user ${userId}`);
        }
        break;

      case Role.Teacher:
        if (user.teacher) {
          Object.assign(profile, {
            firstName: user.teacher.firstName,
            lastName: user.teacher.lastName,
            gender: user.teacher.gender,
            phoneNumber: user.teacher.contactNumber,
            dob: user.teacher.dob,
          });
        } else {
          this.logger.warn(`Teacher profile not found for user ${userId}`);
        }
        break;

      case Role.Parent:
        if (user.parent) {
          Object.assign(profile, {
            firstName: user.parent.firstName,
            lastName: user.parent.lastName,
            phoneNumber: user.parent.contactNumber1,
            gender: user.parent.gender,
            dob: user.parent.dob,
          });
        } else {
          this.logger.warn(`Parent profile not found for user ${userId}`);
        }
        break;

      default:
        this.logger.log(`No additional profile data for role ${user.role}`);
        break;
    }

    return profile;
  }
}
