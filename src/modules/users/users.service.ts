import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/typeorm/entities/user.entity';
import { EntityManager, FindManyOptions, Repository } from 'typeorm';
import { GetUsersDto } from './dto/get-users.dto';
import { BaseService } from 'src/shared/base.service';
import { EntityName } from 'src/shared/error-messages';
import { CreateUserDto } from './dto/create-users.dto';
import { ExistsException } from 'src/shared/exceptions/exists.exception';

@Injectable()
export class UsersService extends BaseService<User> {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
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
}
