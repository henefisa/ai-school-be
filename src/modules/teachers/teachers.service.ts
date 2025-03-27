import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Teacher } from 'src/typeorm/entities/teacher.entity';
import { Repository } from 'typeorm';
import { UsersService } from '../users/users.service';
import { CreateTeacherDto } from './dto/create-teacher.dto';
import { Role } from 'src/shared/constants';
import { UpdateTeacherDto } from './dto/update-teacher.dto';
import { GetTeachersDto } from './dto/get-teacher.dto';
import { BaseService } from 'src/shared/base.service';
import { EntityName } from 'src/shared/error-messages';

@Injectable()
export class TeachersService extends BaseService<Teacher> {
  constructor(
    @InjectRepository(Teacher)
    private readonly teacherRepository: Repository<Teacher>,
    private readonly usersService: UsersService,
  ) {
    super(EntityName.Teacher, teacherRepository);
  }

  async create(dto: CreateTeacherDto) {
    return this.teacherRepository.manager.transaction(async (entityManager) => {
      const teacher = this.teacherRepository.create(dto);
      const createdTeacher = await entityManager.save(Teacher, teacher);

      await this.usersService.create(
        {
          username: dto.username,
          email: dto.email,
          teacherId: createdTeacher.id,
          password: dto.password,
          role: Role.Teacher,
        },
        entityManager,
      );

      return createdTeacher;
    });
  }

  async update(id: string, dto: UpdateTeacherDto) {
    const teacher = await this.getOneOrThrow({
      where: {
        id,
      },
    });

    Object.assign(teacher, dto);

    return this.teacherRepository.save(teacher);
  }

  async delete(id: string) {
    await this.teacherRepository.softDelete({ id });
  }

  async getTeachers(dto: GetTeachersDto) {
    const [results, count] = await this.teacherRepository.findAndCount({
      skip: (dto.page ?? 1 - 1) * (dto.pageSize ?? 10),
      take: dto.pageSize ?? 10,
    });

    return {
      results,
      count,
    };
  }
}
