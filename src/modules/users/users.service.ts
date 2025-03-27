import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from 'src/typeorm/entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as argon2 from 'argon2';
import {
  UserNotFoundException,
  UserEmailExistsException,
} from 'src/shared/exceptions';

/**
 * Service responsible for managing users in the system
 */
@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * Creates a new user in the system
   * @param createUserDto - Data transfer object containing user creation data
   * @returns Promise<User> - The created user
   * @throws UserEmailExistsException if email already exists
   */
  async create(createUserDto: CreateUserDto): Promise<User> {
    const existingUser = await this.userRepository.findOne({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new UserEmailExistsException(createUserDto.email);
    }

    const hashedPassword = await argon2.hash(createUserDto.password);
    const user = this.userRepository.create({
      ...createUserDto,
      password: hashedPassword,
    });

    return this.userRepository.save(user);
  }

  /**
   * Retrieves all users, optionally filtered by role
   * @param role - Optional role to filter users by
   * @returns Promise<User[]> - Array of users
   */
  async findAll(role?: UserRole): Promise<User[]> {
    const query = this.userRepository.createQueryBuilder('user');

    if (role) {
      query.where('user.role = :role', { role });
    }

    return query.getMany();
  }

  /**
   * Retrieves a user by their ID
   * @param id - The user's ID
   * @returns Promise<User> - The found user
   * @throws UserNotFoundException if user not found
   */
  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
    });

    if (!user) {
      throw new UserNotFoundException(id);
    }

    return user;
  }

  /**
   * Updates a user's information
   * @param id - The user's ID
   * @param updateUserDto - Data transfer object containing update data
   * @returns Promise<User> - The updated user
   * @throws UserNotFoundException if user not found
   */
  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);

    if (updateUserDto.password) {
      updateUserDto.password = await argon2.hash(updateUserDto.password);
    }

    Object.assign(user, updateUserDto);
    return this.userRepository.save(user);
  }

  /**
   * Removes a user from the system
   * @param id - The user's ID
   * @returns Promise<void>
   * @throws UserNotFoundException if user not found
   */
  async remove(id: string): Promise<void> {
    const user = await this.findOne(id);
    await this.userRepository.remove(user);
  }

  /**
   * Retrieves all users with a specific role
   * @param role - The role to filter by
   * @returns Promise<User[]> - Array of users with the specified role
   */
  async findByRole(role: UserRole): Promise<User[]> {
    return this.userRepository.find({
      where: { role },
    });
  }

  /**
   * Retrieves a user by their email
   * @param email - The user's email
   * @returns Promise<User> - The found user
   * @throws UserNotFoundException if user not found
   */
  async findByEmail(email: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { email },
    });

    if (!user) {
      throw new UserNotFoundException(email);
    }

    return user;
  }
}
