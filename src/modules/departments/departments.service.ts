import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BaseService } from 'src/shared/base.service';
import { EntityName } from 'src/shared/error-messages';
import { Department } from 'src/typeorm/entities/department.entity';
import { EntityManager, Repository } from 'typeorm';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { ExistsException } from 'src/shared/exceptions/exists.exception';
import { GetDepartmentDto } from './dto/get-departments.dto';

@Injectable()
export class DepartmentsService extends BaseService<Department> {
  constructor(
    @InjectRepository(Department)
    private readonly departmentRepository: Repository<Department>,
  ) {
    super(EntityName.Department, departmentRepository);
  }

  async isNameAvailable(name: string, entityManager?: EntityManager) {
    const department = await this.getOne({ where: { name } }, entityManager);

    if (department) {
      throw new ExistsException(EntityName.Department);
    }

    return true;
  }

  async create(dto: CreateDepartmentDto, entityManager?: EntityManager) {
    await this.isNameAvailable(dto.name);
    const manager = this.getRepository(entityManager);

    return manager.save({ name: dto.name });
  }

  async findAll(dto: GetDepartmentDto) {
    const [results, count] = await this.departmentRepository.findAndCount({
      take: dto.pageSize,
      skip: dto.skip,
    });

    return {
      results,
      count,
    };
  }
}
