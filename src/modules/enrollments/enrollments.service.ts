import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { BaseService } from 'src/shared/base.service';
import { Enrollment } from 'src/typeorm/entities/enrollment.entity';
import { GetEnrollmentsDto } from './dto/get-enrollments.dto';
import {
  FindOptionsWhere,
  Repository,
  Between,
  LessThanOrEqual,
  MoreThanOrEqual,
} from 'typeorm';
import { EntityName } from 'src/shared/error-messages';
import { RegisterEnrollmentDto } from './dto/register-enrollment.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { ClassRoom } from 'src/typeorm/entities/class.entity';
import { EnrollmentStatus } from 'src/shared/constants';
import { UpdateEnrollmentDto } from './dto/update-enrollment.dto';
import { DropEnrollmentDto } from './dto/drop-enrollment.dto';
import { NotFoundException } from '@nestjs/common';
import { CoursesService } from '../courses/courses.service';
import { StudentsService } from '../students/students.service';
import { ClassesService } from '../classes/classes.service';

@Injectable()
export class EnrollmentsService extends BaseService<Enrollment> {
  private readonly logger = new Logger(EnrollmentsService.name);

  constructor(
    @InjectRepository(Enrollment)
    private readonly enrollmentRepository: Repository<Enrollment>,
    @InjectRepository(ClassRoom)
    private readonly classRoomRepository: Repository<ClassRoom>,
    private readonly coursesService: CoursesService,
    private readonly studentsService: StudentsService,
    private readonly classesService: ClassesService,
  ) {
    super(EntityName.Enrollment, enrollmentRepository);
  }

  /**
   * Get enrollments with filtering and pagination
   * @param dto Filtering and pagination parameters
   * @returns Enrollments and count
   */
  async getEnrollments(dto: GetEnrollmentsDto) {
    const where: FindOptionsWhere<Enrollment> = {};
    const relations = {
      student: true,
      classRoom: {
        course: true,
        semester: true,
      },
    };

    // Apply filters
    if (dto.studentId) {
      where.studentId = dto.studentId;
    }

    if (dto.classId) {
      where.classId = dto.classId;
    }

    if (dto.status) {
      where.status = dto.status;
    }

    // Date range filters
    if (dto.startDate && dto.endDate) {
      where.enrollmentDate = Between(dto.startDate, dto.endDate);
    } else if (dto.startDate) {
      where.enrollmentDate = MoreThanOrEqual(dto.startDate);
    } else if (dto.endDate) {
      where.enrollmentDate = LessThanOrEqual(dto.endDate);
    }

    // Get course ID filter from query builder if needed
    const queryBuilder = this.enrollmentRepository
      .createQueryBuilder('enrollment')
      .leftJoinAndSelect('enrollment.student', 'student')
      .leftJoinAndSelect('enrollment.classRoom', 'classRoom')
      .leftJoinAndSelect('classRoom.course', 'course')
      .leftJoinAndSelect('classRoom.semester', 'semester')
      .skip(dto.skip)
      .take(dto.pageSize ?? 10);

    if (dto.courseId) {
      queryBuilder.andWhere('classRoom.courseId = :courseId', {
        courseId: dto.courseId,
      });
    }

    // Search by student name
    if (dto.q) {
      queryBuilder.andWhere(
        '(LOWER(student.firstName) LIKE LOWER(:query) OR LOWER(student.lastName) LIKE LOWER(:query))',
        { query: `%${dto.q}%` },
      );

      const [results, count] = await queryBuilder.getManyAndCount();
      return { results, count };
    }

    // If no text search, use find and count
    const [results, count] = await this.enrollmentRepository.findAndCount({
      where,
      relations,
      skip: dto.skip,
      take: dto.pageSize ?? 10,
      order: {
        enrollmentDate: 'DESC',
      },
    });

    return {
      results,
      count,
    };
  }

  /**
   * Check if an enrollment already exists for a student and class
   * @param studentId Student ID
   * @param classId Class ID
   * @returns Boolean indicating if enrollment exists
   */
  async isEnrollmentExisting(
    studentId: string,
    classId: string,
  ): Promise<boolean> {
    const enrollment = await this.enrollmentRepository.findOne({
      where: {
        studentId,
        classId,
      },
    });

    return !!enrollment;
  }

  /**
   * Verify a student can enroll in a class
   * @param studentId Student ID
   * @param classId Class ID
   */
  async validateEnrollmentEligibility(
    studentId: string,
    classId: string,
  ): Promise<void> {
    // 1. Verify student exists
    await this.studentsService.getOneOrThrow({
      where: { id: studentId },
    });

    // 2. Verify class exists and get details
    const classRoom = await this.classRoomRepository.findOne({
      where: { id: classId },
      relations: {
        course: true,
        enrollments: true,
      },
    });

    if (!classRoom) {
      throw new NotFoundException(`Class with ID ${classId} not found`);
    }

    // 3. Verify class is not at capacity
    if (
      classRoom.maxEnrollment &&
      classRoom.enrollments.length >= classRoom.maxEnrollment
    ) {
      throw new BadRequestException(
        'Class has reached maximum enrollment capacity',
      );
    }

    // 4. Check if student is already enrolled
    const isEnrolled = await this.isEnrollmentExisting(studentId, classId);
    if (isEnrolled) {
      throw new BadRequestException(
        'Student is already enrolled in this class',
      );
    }

    // 5. Check prerequisites
    const prereqCheck = await this.coursesService.checkPrerequisites(
      classRoom.courseId,
      studentId,
    );

    if (!prereqCheck.hasMetPrerequisites) {
      const unmetList = prereqCheck.unmetPrerequisites
        .map((p) => `${p.prerequisite.code}: ${p.reason}`)
        .join(', ');

      throw new BadRequestException(
        `Student does not meet prerequisites for this course: ${unmetList}`,
      );
    }
  }

  /**
   * Register a student for a class
   * @param studentId Student ID
   * @param dto Registration data
   * @returns Created enrollment
   */
  async register(studentId: string, dto: RegisterEnrollmentDto) {
    this.logger.log(
      `Registering student ${studentId} for class ${dto.classId}`,
    );

    // Validate enrollment eligibility
    await this.validateEnrollmentEligibility(studentId, dto.classId);

    // Create enrollment with initial status history
    const enrollment = this.enrollmentRepository.create({
      studentId,
      classId: dto.classId,
      enrollmentDate: new Date(),
      status: EnrollmentStatus.Active,
      notes: dto.notes,
      statusHistory: [
        {
          status: EnrollmentStatus.Active,
          date: new Date(),
          reason: 'Initial enrollment',
        },
      ],
    });

    // Save and return with relations
    const savedEnrollment = await this.enrollmentRepository.save(enrollment);
    this.logger.log(
      `Student ${studentId} successfully enrolled in class ${dto.classId}`,
    );

    return this.getOneOrThrow({
      where: { id: savedEnrollment.id },
      relations: {
        student: true,
        classRoom: {
          course: true,
        },
      },
    });
  }

  /**
   * Update an enrollment's status or details
   * @param id Enrollment ID
   * @param studentId Student ID (for verification)
   * @param dto Update data
   * @returns Updated enrollment
   */
  async update(id: string, studentId: string, dto: UpdateEnrollmentDto) {
    this.logger.log(`Updating enrollment ${id} for student ${studentId}`);

    // Get enrollment and verify student ownership
    const enrollment = await this.getOneOrThrow({
      where: { id, studentId },
    });

    // Track status change if provided
    if (dto.status && dto.status !== enrollment.status) {
      // Create status history entry
      const statusHistory = enrollment.statusHistory || [];
      statusHistory.push({
        status: dto.status,
        date: new Date(),
        reason: dto.reason || 'Status updated',
      });

      // Update enrollment
      Object.assign(enrollment, {
        status: dto.status,
        statusHistory,
        notes: dto.notes !== undefined ? dto.notes : enrollment.notes,
      });
    } else if (dto.notes !== undefined) {
      // Just update notes
      enrollment.notes = dto.notes;
    }

    // Save changes
    await this.enrollmentRepository.save(enrollment);
    this.logger.log(`Enrollment ${id} successfully updated`);

    // Return updated enrollment with relations
    return this.getOneOrThrow({
      where: { id },
      relations: {
        student: true,
        classRoom: {
          course: true,
        },
      },
    });
  }

  /**
   * Drop a class (set enrollment status to Dropped)
   * @param id Enrollment ID
   * @param studentId Student ID (for verification)
   * @param dto Drop enrollment data
   * @returns Updated enrollment
   */
  async dropClass(id: string, studentId: string, dto: DropEnrollmentDto) {
    this.logger.log(`Student ${studentId} dropping class (enrollment ${id})`);

    // Update enrollment with Dropped status
    return this.update(id, studentId, {
      status: EnrollmentStatus.Dropped,
      reason: dto.reason,
      notes: dto.notes,
    });
  }

  /**
   * Delete an enrollment (admin function)
   * @param id Enrollment ID to delete
   */
  async delete(id: string) {
    this.logger.log(`Deleting enrollment ${id}`);

    await this.getOneOrThrow({
      where: { id },
    });

    await this.enrollmentRepository.delete({ id });
    this.logger.log(`Enrollment ${id} successfully deleted`);
  }

  /**
   * Get enrollment details by ID
   * @param id Enrollment ID
   * @returns Enrollment with relations
   */
  async getEnrollmentById(id: string): Promise<Enrollment> {
    return this.getOneOrThrow({
      where: { id },
      relations: {
        student: true,
        classRoom: {
          course: true,
          semester: true,
          assignments: {
            teacher: true,
          },
        },
        attendances: true,
        grades: true,
      },
    });
  }
}
