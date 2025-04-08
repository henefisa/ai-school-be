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
import {
  GetCoursesByDepartmentDto,
  GetCoursesDto,
} from './dto/get-courses.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { ExistsException } from 'src/shared/exceptions/exists.exception';
import { ClassRoom } from 'src/typeorm/entities/class.entity';
import { DepartmentsService } from 'src/modules/departments/departments.service';
import { AddPrerequisiteDto } from './dto/add-prerequisite.dto';
import { CoursePrerequisite } from 'src/typeorm/entities/course-prerequisite.entity';
import { NotFoundException } from '@nestjs/common';
import { EnrollmentStatus, Grade } from 'src/shared/constants';
import { Enrollment } from 'src/typeorm/entities/enrollment.entity';
import { GetCourseDto } from './dto/get-course.dto';

@Injectable()
export class CoursesService extends BaseService<Course> {
  constructor(
    @InjectRepository(Course)
    private readonly courseRepository: Repository<Course>,
    @InjectRepository(CoursePrerequisite)
    private readonly prerequisiteRepository: Repository<CoursePrerequisite>,
    @InjectRepository(Enrollment)
    private readonly enrollmentRepository: Repository<Enrollment>,
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
        status: dto.status || 'ACTIVE',
      });

      // 5. Save the course
      const savedCourse = await entityManager.save(Course, course);

      // 6. Return the created course with department relationship
      return this.getOneOrThrow(
        {
          where: { id: savedCourse.id },
          relations: {
            department: true,
          },
        },
        entityManager,
      );
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
      await this.departmentsService.verifyDepartmentExists(dto.departmentId);
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
      relations: {
        department: dto.includeDepartment,
      },
    });

    return {
      results,
      count,
    };
  }

  async getDepartmentCourses(
    departmentId: string,
    dto: GetCoursesByDepartmentDto,
  ) {
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

  /**
   * Add a prerequisite to a course
   * @param courseId The course ID to add a prerequisite to
   * @param dto The prerequisite details
   * @returns The created prerequisite relationship
   */
  async addPrerequisite(courseId: string, dto: AddPrerequisiteDto) {
    // Verify course exists
    await this.getOneOrThrow({
      where: { id: courseId },
    });
    // Verify prerequisite course exists
    await this.getOneOrThrow({
      where: { id: dto.prerequisiteId },
    });
    // Prevent a course from being a prerequisite of itself
    if (courseId === dto.prerequisiteId) {
      throw new BadRequestException(
        'A course cannot be a prerequisite of itself',
      );
    }
    // Check if the prerequisite relationship already exists
    const existingPrereq = await this.prerequisiteRepository.findOne({
      where: {
        courseId,
        prerequisiteId: dto.prerequisiteId,
      },
    });
    if (existingPrereq) {
      throw new ExistsException(EntityName.Course);
    }
    // Create and save prerequisite relationship
    const prerequisiteRelation = this.prerequisiteRepository.create({
      courseId,
      prerequisiteId: dto.prerequisiteId,
      minGrade: dto.minGrade,
      isRequired: dto.isRequired ?? true,
      notes: dto.notes,
    });
    return this.prerequisiteRepository.save(prerequisiteRelation);
  }

  /**
   * Remove a prerequisite from a course
   * @param courseId The course ID to remove a prerequisite from
   * @param prerequisiteId The ID of the prerequisite course to remove
   */
  async removePrerequisite(
    courseId: string,
    prerequisiteId: string,
  ): Promise<void> {
    const result = await this.prerequisiteRepository.delete({
      courseId,
      prerequisiteId,
    });

    if (result.affected === 0) {
      throw new NotFoundException(
        `Prerequisite relationship not found for course ${courseId} and prerequisite ${prerequisiteId}`,
      );
    }
  }

  /**
   * Get all prerequisites for a course
   * @param courseId The course ID to get prerequisites for
   * @returns List of prerequisite relationships with course details
   */
  async getPrerequisites(courseId: string): Promise<CoursePrerequisite[]> {
    // Verify course exists
    await this.getOneOrThrow({
      where: { id: courseId },
    });

    return this.prerequisiteRepository.find({
      where: { courseId },
      relations: {
        prerequisite: true,
      },
    });
  }

  /**
   * Check if a student has met all required prerequisites for a course
   * @param courseId The course ID to check prerequisites for
   * @param studentId The student ID to check prerequisites satisfaction
   * @returns Object with hasMetPrerequisites flag and details of unmet prerequisites
   */
  async checkPrerequisites(
    courseId: string,
    studentId: string,
  ): Promise<{
    hasMetPrerequisites: boolean;
    unmetPrerequisites: Array<{
      prerequisite: Course;
      reason: string;
    }>;
  }> {
    // Get all prerequisites for the course
    const prerequisites = await this.getPrerequisites(courseId);
    const unmetPrerequisites: Array<{
      prerequisite: Course;
      reason: string;
    }> = [];

    // If no prerequisites, return true
    if (prerequisites.length === 0) {
      return {
        hasMetPrerequisites: true,
        unmetPrerequisites: [],
      };
    }

    // Check each required prerequisite
    for (const prereq of prerequisites) {
      // Skip non-required prerequisites
      if (!prereq.isRequired) continue;

      // Check if student has completed the prerequisite course
      const enrollment = await this.enrollmentRepository
        .createQueryBuilder('enrollment')
        .innerJoin('enrollment.classRoom', 'classRoom')
        .where('enrollment.studentId = :studentId', { studentId })
        .andWhere('classRoom.courseId = :courseId', {
          courseId: prereq.prerequisiteId,
        })
        .andWhere('enrollment.status = :status', {
          status: EnrollmentStatus.Completed,
        })
        .getOne();

      // If not enrolled or not completed, add to unmet prerequisites
      if (!enrollment) {
        unmetPrerequisites.push({
          prerequisite: prereq.prerequisite,
          reason: 'Course not completed',
        });
        continue;
      }

      // If minimum grade requirement exists, check if student meets it
      if (prereq.minGrade && enrollment.grade) {
        const gradeValues = {
          [Grade.APlus]: 4.3,
          [Grade.A]: 4.0,
          [Grade.AMinus]: 3.7,
          [Grade.BPlus]: 3.3,
          [Grade.B]: 3.0,
          [Grade.BMinus]: 2.7,
          [Grade.CPlus]: 2.3,
          [Grade.C]: 2.0,
          [Grade.CMinus]: 1.7,
          [Grade.DPlus]: 1.3,
          [Grade.D]: 1.0,
          [Grade.F]: 0.0,
        };

        const minGradeValue = this.getGradeValue(prereq.minGrade);
        const studentGradeValue = gradeValues[enrollment.grade];

        if (studentGradeValue < minGradeValue) {
          unmetPrerequisites.push({
            prerequisite: prereq.prerequisite,
            reason: `Grade ${enrollment.grade} does not meet minimum requirement of ${prereq.minGrade}`,
          });
        }
      }
    }

    return {
      hasMetPrerequisites: unmetPrerequisites.length === 0,
      unmetPrerequisites,
    };
  }

  /**
   * Convert a letter grade to its numeric value
   * @param grade Letter grade (A, B+, etc.)
   * @returns Numeric grade value
   */
  private getGradeValue(grade: string): number {
    const gradeMap: Record<string, number> = {
      'A+': 4.3,
      A: 4.0,
      'A-': 3.7,
      'B+': 3.3,
      B: 3.0,
      'B-': 2.7,
      'C+': 2.3,
      C: 2.0,
      'C-': 1.7,
      'D+': 1.3,
      D: 1.0,
      F: 0.0,
    };

    return gradeMap[grade] || 0;
  }

  /**
   * Verify that a course exists by ID
   * @param id Course ID to verify
   * @returns The course if it exists
   * @throws NotFoundException if the course doesn't exist
   */
  async verifyCourseExists(id: string) {
    return this.getOneOrThrow({
      where: { id },
    });
  }

  async getCourseById(id: string, dto: GetCourseDto) {
    return this.getOneOrThrow({
      where: {
        id,
      },
      relations: {
        department: dto.includeDepartment,
      },
    });
  }
}
