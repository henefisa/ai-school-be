import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BaseService } from 'src/shared/base.service';
import { EntityName } from 'src/shared/error-messages';
import { ClassRoom } from 'src/typeorm/entities/class.entity';
import { FindOptionsWhere, ILike, Repository } from 'typeorm';
import { CreateClassDto } from './dto/create-class.dto';
import { CoursesService } from '../courses/courses.service';
import { GetClassesDto } from './dto/get-classes.dto';
import { ClassAssignment } from 'src/typeorm/entities/class-assignment.entity';
import { AssignTeacherDto } from './dto/assign-teacher.dto';
import { Enrollment } from 'src/typeorm/entities/enrollment.entity';
import { EnrollStudentDto } from './dto/enroll-student.dto';

@Injectable()
export class ClassesService extends BaseService<ClassRoom> {
  constructor(
    @InjectRepository(ClassRoom)
    private readonly classRepository: Repository<ClassRoom>,
    @InjectRepository(ClassAssignment)
    private readonly classAssignmentRepository: Repository<ClassAssignment>,
    @InjectRepository(Enrollment)
    private readonly enrollmentRepository: Repository<Enrollment>,
    private readonly coursesService: CoursesService,
  ) {
    super(EntityName.Class, classRepository);
  }

  /**
   * Create a new class
   * @param dto Class creation data
   * @returns The created class
   */
  async create(dto: CreateClassDto) {
    const course = await this.coursesService.getOneOrThrow({
      where: { id: dto.courseId },
    });

    return this.classRepository.save({
      courseId: course.id,
      semesterId: dto.semesterId,
      name: dto.name,
      gradeLevel: dto.gradeLevel,
      section: dto.section,
      startTime: dto.startTime,
      endTime: dto.endTime,
      dayOfWeek: dto.dayOfWeek,
      roomId: dto.roomId,
      maxEnrollment: dto.maxEnrollment,
      status: dto.status || 'ACTIVE',
      description: dto.description,
      startDate: dto.startDate,
      endDate: dto.endDate,
    });
  }

  /**
   * Update an existing class
   * @param id ID of the class to update
   * @param dto Update data
   * @returns The updated class
   */
  async update(id: string, dto: Partial<CreateClassDto>) {
    const classEntity = await this.getOneOrThrow({
      where: { id },
    });

    // If courseId is provided, verify that the course exists
    if (dto.courseId) {
      await this.coursesService.getOneOrThrow({
        where: { id: dto.courseId },
      });
    }

    // Update the class entity with provided data
    Object.assign(classEntity, dto);

    return this.classRepository.save(classEntity);
  }

  /**
   * Delete a class
   * @param id ID of the class to delete
   * @returns Success message
   */
  async delete(id: string) {
    const classEntity = await this.getOneOrThrow({
      where: { id },
      relations: {
        enrollments: true,
        assignments: true,
      },
    });

    // Check if there are any enrollments or assignments
    if (classEntity.enrollments?.length > 0) {
      throw new BadRequestException(
        `Cannot delete class with ${classEntity.enrollments.length} enrollments. Remove enrollments first.`,
      );
    }

    await this.classRepository.softDelete({ id });
    return { message: 'Class deleted successfully' };
  }

  /**
   * Get classes with filtering and pagination
   * @param dto Query parameters
   * @returns Paginated list of classes
   */
  async findAll(dto: GetClassesDto) {
    const where: FindOptionsWhere<ClassRoom> = {};

    // Apply filters
    if (dto.name) {
      where.name = ILike(`%${dto.name}%`);
    }

    if (dto.courseId) {
      where.courseId = dto.courseId;
    }

    if (dto.semesterId) {
      where.semesterId = dto.semesterId;
    }

    if (dto.gradeLevel) {
      where.gradeLevel = dto.gradeLevel;
    }

    if (dto.section) {
      where.section = dto.section;
    }

    if (dto.dayOfWeek) {
      where.dayOfWeek = dto.dayOfWeek;
    }

    if (dto.roomId) {
      where.roomId = dto.roomId;
    }

    if (dto.status) {
      where.status = dto.status;
    }

    // Set up sorting
    const orderBy: Record<string, 'ASC' | 'DESC'> = {};
    if (dto.sortBy) {
      orderBy[dto.sortBy] = dto.sortOrder || 'ASC';
    } else {
      orderBy.updatedAt = 'DESC';
    }

    // Query with pagination
    const [results, count] = await this.classRepository.findAndCount({
      where,
      order: orderBy,
      skip: ((dto.page || 1) - 1) * (dto.pageSize || 10),
      take: dto.pageSize || 10,
      relations: {
        course: true,
        semester: true,
        room: true,
      },
    });

    return {
      results,
      count,
    };
  }

  /**
   * Get detailed information about a class
   * @param id Class ID
   * @returns Class with relationships
   */
  async getClassDetails(id: string) {
    const classEntity = await this.classRepository.findOne({
      where: { id },
      relations: {
        course: true,
        semester: true,
        room: true,
        enrollments: {
          student: true,
        },
        assignments: {
          teacher: true,
        },
      },
    });

    if (!classEntity) {
      throw new NotFoundException(`Class with ID ${id} not found`);
    }

    // Calculate some statistics
    const enrollmentCount = classEntity.enrollments?.length || 0;
    const availableSeats = classEntity.maxEnrollment - enrollmentCount;
    const teachers =
      classEntity.assignments?.map((assignment) => ({
        id: assignment.teacher.id,
        name: `${assignment.teacher.firstName} ${assignment.teacher.lastName}`,
        email: assignment.teacher.email,
        startDate: assignment.startDate,
        endDate: assignment.endDate,
      })) || [];

    return {
      ...classEntity,
      enrollmentCount,
      availableSeats,
      teachers,
    };
  }

  /**
   * Assign a teacher to a class
   * @param classId Class ID
   * @param dto Teacher assignment data
   * @returns Created assignment
   */
  async assignTeacher(classId: string, dto: AssignTeacherDto) {
    // Verify the class exists
    await this.getOneOrThrow({ where: { id: classId } });

    // Check if assignment already exists
    const existingAssignment = await this.classAssignmentRepository.findOne({
      where: {
        classId,
        teacherId: dto.teacherId,
      },
    });

    if (existingAssignment) {
      throw new BadRequestException(
        `Teacher is already assigned to this class`,
      );
    }

    // Create the assignment
    const assignment = await this.classAssignmentRepository.save({
      classId,
      teacherId: dto.teacherId,
      startDate: dto.startDate,
      endDate: dto.endDate,
    });

    return assignment;
  }

  /**
   * Remove a teacher from a class
   * @param classId Class ID
   * @param teacherId Teacher ID
   * @returns Success message
   */
  async removeTeacher(classId: string, teacherId: string) {
    // Verify the assignment exists
    const assignment = await this.classAssignmentRepository.findOne({
      where: {
        classId,
        teacherId,
      },
    });

    if (!assignment) {
      throw new NotFoundException(
        `Teacher assignment not found for this class`,
      );
    }

    // Remove the assignment
    await this.classAssignmentRepository.softDelete(assignment.id);

    return { message: 'Teacher removed from class successfully' };
  }

  /**
   * Get all teachers assigned to a class
   * @param classId Class ID
   * @returns List of teachers with assignment details
   */
  async getClassTeachers(classId: string) {
    // Verify the class exists
    await this.getOneOrThrow({ where: { id: classId } });

    // Get assignments with teacher details
    const assignments = await this.classAssignmentRepository.find({
      where: { classId },
      relations: {
        teacher: true,
      },
    });

    return assignments.map((assignment) => ({
      assignmentId: assignment.id,
      teacherId: assignment.teacher.id,
      name: `${assignment.teacher.firstName} ${assignment.teacher.lastName}`,
      email: assignment.teacher.email,
      startDate: assignment.startDate,
      endDate: assignment.endDate,
    }));
  }

  /**
   * Enroll a student in a class
   * @param classId Class ID
   * @param dto Student enrollment data
   * @returns Created enrollment
   */
  async enrollStudent(classId: string, dto: EnrollStudentDto) {
    // Verify the class exists and get details
    const classEntity = await this.getOneOrThrow({
      where: { id: classId },
      relations: { enrollments: true },
    });

    // Check if the class is at capacity
    if (classEntity.enrollments.length >= classEntity.maxEnrollment) {
      throw new BadRequestException(`Class has reached maximum enrollment`);
    }

    // Check if student is already enrolled
    const existingEnrollment = await this.enrollmentRepository.findOne({
      where: {
        classId,
        studentId: dto.studentId,
      },
    });

    if (existingEnrollment) {
      throw new BadRequestException(
        `Student is already enrolled in this class`,
      );
    }

    // Create the enrollment
    const enrollment = await this.enrollmentRepository.save({
      classId,
      studentId: dto.studentId,
      enrollmentDate: dto.enrollmentDate || new Date(),
    });

    return enrollment;
  }

  /**
   * Remove a student enrollment from a class
   * @param classId Class ID
   * @param studentId Student ID
   * @returns Success message
   */
  async removeStudentEnrollment(classId: string, studentId: string) {
    // Verify the enrollment exists
    const enrollment = await this.enrollmentRepository.findOne({
      where: {
        classId,
        studentId,
      },
    });

    if (!enrollment) {
      throw new NotFoundException(
        `Student enrollment not found for this class`,
      );
    }

    // Remove the enrollment
    await this.enrollmentRepository.softDelete(enrollment.id);

    return { message: 'Student removed from class successfully' };
  }

  /**
   * Get all students enrolled in a class
   * @param classId Class ID
   * @returns List of enrolled students with enrollment details
   */
  async getEnrolledStudents(classId: string) {
    // Verify the class exists
    await this.getOneOrThrow({ where: { id: classId } });

    // Get enrollments with student details
    const enrollments = await this.enrollmentRepository.find({
      where: { classId },
      relations: {
        student: true,
      },
    });

    return enrollments.map((enrollment) => ({
      enrollmentId: enrollment.id,
      studentId: enrollment.student.id,
      name: `${enrollment.student.firstName} ${enrollment.student.lastName}`,
      email: enrollment.student.email,
      enrollmentDate: enrollment.enrollmentDate,
      grade: enrollment.grade,
    }));
  }
}
