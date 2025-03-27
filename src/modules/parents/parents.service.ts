import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Parent } from 'src/typeorm/entities/parent.entity';
import { Repository } from 'typeorm';
import { CreateParentDto } from './dto/create-parent.dto';
import { UpdateParentDto } from './dto/update-parent.dto';
import { GetParentsDto } from './dto/get-parents.dto';
import { BaseService } from 'src/shared/base.service';
import { EntityName } from 'src/shared/error-messages';
import { Student } from 'src/typeorm/entities/student.entity';

@Injectable()
export class ParentsService extends BaseService<Parent> {
  constructor(
    @InjectRepository(Parent)
    private readonly parentRepository: Repository<Parent>,
    @InjectRepository(Student)
    private readonly studentRepository: Repository<Student>,
  ) {
    super(EntityName.Parent, parentRepository);
  }

  async create(createParentDto: CreateParentDto): Promise<Parent> {
    const parent = this.parentRepository.create(createParentDto);
    return this.parentRepository.save(parent);
  }

  async getParents(dto: GetParentsDto) {
    const queryBuilder = this.parentRepository.createQueryBuilder('parent');

    // Apply search filter if query parameter exists
    if (dto.q) {
      queryBuilder.where(
        '(parent.first_name ILIKE :query OR parent.last_name ILIKE :query OR parent.email ILIKE :query)',
        { query: `%${dto.q}%` },
      );
    }

    // Join with User to get status information
    if (dto.status !== undefined) {
      queryBuilder
        .leftJoin('user', 'user', 'user.parent_id = parent.id')
        .andWhere('user.is_active = :status', { status: dto.status });
    }

    // Apply pagination
    queryBuilder
      .skip(dto.page && dto.pageSize ? (dto.page - 1) * dto.pageSize : 0)
      .take(dto.pageSize || 10)
      .orderBy('parent.created_at', 'DESC');

    const [results, count] = await queryBuilder.getManyAndCount();

    return {
      results,
      count,
    };
  }

  async getParentById(id: string): Promise<Parent> {
    return this.getOneOrThrow({
      where: { id },
    });
  }

  async getChildrenByParentId(id: string): Promise<Student[]> {
    // First verify that the parent exists
    await this.getOneOrThrow({
      where: { id },
    });

    // Then find all children associated with this parent using query builder
    return this.studentRepository
      .createQueryBuilder('student')
      .leftJoinAndSelect('student.user', 'user')
      .where('student.parent_id = :parentId', { parentId: id })
      .getMany();
  }

  async update(id: string, updateParentDto: UpdateParentDto): Promise<Parent> {
    const parent = await this.getOneOrThrow({
      where: { id },
    });

    Object.assign(parent, updateParentDto);

    return this.parentRepository.save(parent);
  }

  async delete(id: string): Promise<void> {
    await this.parentRepository.softDelete({ id });
  }
}
