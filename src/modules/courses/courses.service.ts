import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BaseService } from 'src/shared/base.service';
import { EntityName } from 'src/shared/error-messages';
import { Course } from 'src/typeorm/entities/course.entity';
import {
  EntityManager,
  FindOptionsWhere,
  ILike,
  Not,
  Repository,
} from 'typeorm';
import { CreateCourseDto } from './dto/create-course.dto';
import { GetCoursesDto } from './dto/get-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { ExistsException } from 'src/shared/exceptions/exists.exception';
import { ClassRoom } from 'src/typeorm/entities/class.entity';
import { Teacher } from 'src/typeorm/entities/teacher.entity';
import { DepartmentsService } from 'src/modules/departments/departments.service';

@Injectable()
export class CoursesService extends BaseService<Course> {
  constructor(
    @InjectRepository(Course)
    private readonly courseRepository: Repository<Course>,
    @InjectRepository(ClassRoom)
    private readonly classRoomRepository: Repository<ClassRoom>,
    private readonly departmentsService: DepartmentsService,
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

  async isCodeAvailable(
    code: string,
    entityManager?: EntityManager,
    id?: string,
  ) {
    const course = await this.getOne(
      {
        where: {
          code,
          ...(id && { id: Not(id) }),
        },
      },
      entityManager,
    );

    if (course) {
      throw new BadRequestException(`Course with code ${code} already exists`);
    }

    return true;
  }

  async create(dto: CreateCourseDto) {
    return this.courseRepository.manager.transaction(async (entityManager) => {
      // 1. Check if course name is available
      await this.isNameAvailable(dto.name, entityManager);

      // 2. Check if course code is available
      await this.isCodeAvailable(dto.code, entityManager);

      // 3. Verify department exists if provided
      if (dto.departmentId) {
        await this.departmentsService.verifyDepartmentExists(dto.departmentId);
      }

      // 4. Create the course object
      const course = entityManager.create(Course, {
        name: dto.name,
        code: dto.code,
        description: dto.description,
        credits: dto.credits,
        required: dto.required,
        departmentId: dto.departmentId,
        syllabus: dto.syllabus,
        level: dto.level,
        startDate: dto.startDate,
        endDate: dto.endDate,
        status: dto.status || 'ACTIVE',
        maxStudents: dto.maxStudents,
        location: dto.location,
        classDays: dto.classDays,
        prerequisites: dto.prerequisites,
      });

      // 5. Save the course
      const savedCourse = await entityManager.save(Course, course);

      // 6. Return the created course with department relationship
      return this.getOneOrThrow({
        where: { id: savedCourse.id },
        relations: {
          department: true,
        },
      });
    });
  }

  async update(id: string, dto: UpdateCourseDto) {
    const course = await this.getOneOrThrow({
      where: {
        id,
      },
    });

    if (dto.name && dto.name !== course.name) {
      await this.isNameAvailable(dto.name, undefined, id);
    }

    if (dto.code && dto.code !== course.code) {
      await this.isCodeAvailable(dto.code, undefined, id);
    }

    // Verify department exists if provided
    if (dto.departmentId) {
      try {
        await this.departmentsService.verifyDepartmentExists(dto.departmentId);
      } catch {
        throw new BadRequestException(
          `Department with ID ${dto.departmentId} does not exist`,
        );
      }
    }

    Object.assign(course, dto);

    return this.courseRepository.save(course);
  }

  async delete(id: string) {
    // Check if the course is linked to any classes
    const classes = await this.classRoomRepository.find({
      where: { courseId: id },
    });

    if (classes.length > 0) {
      throw new BadRequestException(
        `Cannot delete the course as it is associated with ${classes.length} class(es). Please remove or reassign the classes first.`,
      );
    }

    await this.courseRepository.softDelete({ id });
    return { message: 'Course deleted successfully' };
  }

  async getCourses(dto: GetCoursesDto) {
    const where: FindOptionsWhere<Course> = {};

    if (dto.name) {
      where.name = ILike(`%${dto.name}%`);
    }

    if (dto.code) {
      where.code = ILike(`%${dto.code}%`);
    }

    if (dto.departmentId) {
      where.departmentId = dto.departmentId;
    }

    if (dto.status) {
      where.status = dto.status;
    }

    if (dto.level) {
      where.level = dto.level;
    }

    const orderBy: Record<string, 'ASC' | 'DESC'> = {};
    if (dto.sortBy) {
      orderBy[dto.sortBy] = dto.sortOrder || 'ASC';
    } else {
      orderBy.updatedAt = 'DESC';
    }

    const [results, count] = await this.courseRepository.findAndCount({
      where,
      order: orderBy,
      skip: ((dto.page || 1) - 1) * (dto.pageSize || 10),
      take: dto.pageSize || 10,
      relations: ['department'],
    });

    return {
      results,
      count,
    };
  }

  async getCourseDetails(id: string) {
    const course = await this.courseRepository.findOne({
      where: { id },
      relations: {
        department: true,
        classes: {
          assignments: {
            teacher: true,
          },
          enrollments: {
            student: true,
          },
        },
      },
    });

    if (!course) {
      throw new BadRequestException(`Course with ID ${id} not found`);
    }

    // Transform data to make it more usable for the frontend
    const teachers = new Map<string, Partial<Teacher>>();
    let enrolledStudentsCount = 0;

    for (const classItem of course.classes) {
      // Count enrollments
      enrolledStudentsCount += classItem.enrollments?.length || 0;

      // Collect unique teachers
      for (const assignment of classItem.assignments || []) {
        if (assignment.teacher) {
          teachers.set(assignment.teacher.id, {
            id: assignment.teacher.id,
            firstName: assignment.teacher.firstName,
            lastName: assignment.teacher.lastName,
            email: assignment.teacher.email,
          });
        }
      }
    }

    return {
      ...course,
      teachersCount: teachers.size,
      teachers: Array.from(teachers.values()),
      enrolledStudentsCount,
      // Include other calculated fields as needed
    };
  }

  async getDepartmentCourses(departmentId: string, dto: GetCoursesDto) {
    await this.departmentsService.verifyDepartmentExists(departmentId);

    const where: FindOptionsWhere<Course> = { departmentId };

    if (dto.name) {
      where.name = ILike(`%${dto.name}%`);
    }

    if (dto.code) {
      where.code = ILike(`%${dto.code}%`);
    }

    if (dto.status) {
      where.status = dto.status;
    }

    if (dto.level) {
      where.level = dto.level;
    }

    const orderBy: Record<string, 'ASC' | 'DESC'> = {};
    if (dto.sortBy) {
      orderBy[dto.sortBy] = dto.sortOrder || 'ASC';
    } else {
      orderBy.updatedAt = 'DESC';
    }

    const [results, count] = await this.courseRepository.findAndCount({
      where,
      order: orderBy,
      skip: dto.skip,
      take: dto.pageSize || 10,
    });

    return {
      results,
      count,
    };
  }
}
