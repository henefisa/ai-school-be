import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BaseService } from 'src/shared/base.service';
import { EntityName } from 'src/shared/error-messages';
import { ClassRoom } from 'src/typeorm/entities/class.entity';
import { Repository } from 'typeorm';
import { CreateClassDto } from './dto/create-class.dto';
import { CoursesService } from '../courses/courses.service';
import { GetClassesDto } from './dto/get-classes.dto';

@Injectable()
export class ClassesService extends BaseService<ClassRoom> {
  constructor(
    @InjectRepository(ClassRoom)
    private readonly classRepository: Repository<ClassRoom>,
    private readonly coursesService: CoursesService,
  ) {
    super(EntityName.Class, classRepository);
  }

  async create(dto: CreateClassDto) {
    const course = await this.coursesService.getOneOrThrow({
      where: { id: dto.courseId },
    });

    return this.classRepository.save({
      courseId: course.id,
      semesterId: dto.semesterId,
      name: dto.name,
      startTime: dto.startTime,
      endTime: dto.endTime,
      dayOfWeek: dto.dayOfWeek,
      maxEnrollment: dto.maxEnrollment,
    });
  }

  async findAll(dto: GetClassesDto) {
    const [results, count] = await this.classRepository.findAndCount({
      skip: (dto.page ?? 1 - 1) * (dto.pageSize ?? 10),
      take: dto.pageSize ?? 10,
    });

    return {
      results,
      count,
    };
  }
}
