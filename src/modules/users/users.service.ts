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

  async isUsernameAvailable(username: string, userId?: string) {
    const user = await this.userRepository.findOne({
      where: {
        username,
      },
    });

    if (user && user.id !== userId) {
      throw new ExistsException(EntityName.User);
    }

    return true;
  }

  async getMany(options: FindManyOptions<User>) {
    return this.userRepository.find(options);
  }

  async create(createUserDto: CreateUserDto, entityManager?: EntityManager) {
    await this.isUsernameAvailable(createUserDto.username);
    const user = this.userRepository.create(createUserDto);
    const manager = this.getRepository(entityManager);

    return manager.save(user);
  }

  async findAll(dto: GetUsersDto) {
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
   * Update a user's information
   */
  async update(
    id: string,
    updateData: Partial<User>,
    entityManager?: EntityManager,
  ) {
    const user = await this.getOneOrThrow({
      where: { id },
    });

    // If username is being updated, check if it's available
    if (updateData.username && updateData.username !== user.username) {
      await this.isUsernameAvailable(updateData.username, id);
    }

    // Update user fields
    Object.assign(user, updateData);

    // Save using either provided entity manager or repository
    const manager = this.getRepository(entityManager);
    return manager.save(user);
  }
}
