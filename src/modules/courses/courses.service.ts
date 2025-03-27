import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BaseService } from 'src/shared/base.service';
import { EntityName } from 'src/shared/error-messages';
import { Course } from 'src/typeorm/entities/course.entity';
import { EntityManager, Not, Repository } from 'typeorm';
import { CreateCourseDto } from './dto/create-course.dto';
import { GetCoursesDto } from './dto/get-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { ExistsException } from 'src/shared/exceptions/exists.exception';

@Injectable()
export class CoursesService extends BaseService<Course> {
  constructor(
    @InjectRepository(Course)
    private readonly courseRepository: Repository<Course>,
  ) {
    super(EntityName.Course, courseRepository);
  }

  async isNameAvailable(
    name: string,
    entityManager?: EntityManager,
    id?: string,
  ) {
    const course = await this.getOne(
      {
        where: {
          name,
          ...(id && { id: Not(id) }),
        },
      },
      entityManager,
    );

    if (course) {
      throw new ExistsException(EntityName.Course);
    }

    return true;
  }

  async create(dto: CreateCourseDto, entityManager?: EntityManager) {
    await this.isNameAvailable(dto.name);

    const manager = this.getRepository(entityManager);

    return manager.save({
      name: dto.name,
      description: dto.description,
      credits: dto.credits,
      required: dto.required,
      departmentId: dto.departmentId,
    });
  }

  async update(id: string, dto: UpdateCourseDto) {
    const course = await this.getOneOrThrow({
      where: {
        id,
      },
    });

    if (dto.name) {
      await this.isNameAvailable(dto.name, undefined, id);
    }

    Object.assign(course, dto);

    return this.courseRepository.save(course);
  }

  async delete(id: string) {
    await this.courseRepository.delete({ id });
  }

  async getCourses(dto: GetCoursesDto) {
    const [results, count] = await this.courseRepository.findAndCount({
      skip: (dto.page ?? 1 - 1) * (dto.pageSize ?? 10),
      take: dto.pageSize ?? 10,
    });

    return {
      results,
      count,
    };
  }
}
