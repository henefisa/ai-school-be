import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BaseService } from 'src/shared/base.service';
import { EntityName } from 'src/shared/error-messages';
import { Department } from 'src/typeorm/entities/department.entity';
import { Teacher } from 'src/typeorm/entities/teacher.entity';
import { EntityManager, FindOneOptions, Not, Repository } from 'typeorm';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { ExistsException } from 'src/shared/exceptions/exists.exception';
import { GetDepartmentsDto } from './dto/get-departments.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { GetDepartmentDto } from './dto/get-department.dto';

@Injectable()
export class DepartmentsService extends BaseService<Department> {
  constructor(
    @InjectRepository(Department)
    private readonly departmentRepository: Repository<Department>,
    @InjectRepository(Teacher)
    private readonly teacherRepository: Repository<Teacher>,
  ) {
    super(EntityName.Department, departmentRepository);
  }

  /**
   * Check if department name is available
   * @param name Department name to check
   * @param excludeDepartmentId Optional department ID to exclude from check (for updates)
   * @param entityManager Optional entity manager for transactions
   * @returns True if the name is available
   * @throws ExistsException if the name is already taken
   */
  async isNameAvailable(
    name: string,
    excludeDepartmentId?: string,
    entityManager?: EntityManager,
  ): Promise<boolean> {
    const query: FindOneOptions<Department> = { where: { name } };

    if (excludeDepartmentId) {
      query.where = { name, id: Not(excludeDepartmentId) };
    }

    const department = await this.getOne(query, entityManager);

    if (department) {
      throw new ExistsException(EntityName.Department);
    }

    return true;
  }

  /**
   * Check if department code is available
   * @param code Department code to check
   * @param excludeDepartmentId Optional department ID to exclude from check (for updates)
   * @param entityManager Optional entity manager for transactions
   * @returns True if the code is available
   * @throws ExistsException if the code is already taken
   */
  async isCodeAvailable(
    code: string,
    excludeDepartmentId?: string,
    entityManager?: EntityManager,
  ): Promise<boolean> {
    const query: FindOneOptions<Department> = { where: { code } };

    if (excludeDepartmentId) {
      query.where = { code, id: Not(excludeDepartmentId) };
    }

    const department = await this.getOne(query, entityManager);

    if (department) {
      throw new ExistsException(EntityName.Department);
    }

    return true;
  }

  /**
   * Verify that a teacher exists by ID
   * @param id Teacher ID to verify
   * @returns The teacher if it exists
   * @throws NotFoundException if the teacher doesn't exist
   */
  async verifyTeacherExists(id: string): Promise<Teacher> {
    const teacher = await this.teacherRepository.findOne({
      where: { id },
    });

    if (!teacher) {
      throw new NotFoundException(`Teacher with ID ${id} not found`);
    }

    return teacher;
  }

  /**
   * Create a new department
   * @param dto Data for creating department
   * @param entityManager Optional entity manager for transactions
   * @returns The created department
   */
  async create(
    dto: CreateDepartmentDto,
    entityManager?: EntityManager,
  ): Promise<Department> {
    await this.isNameAvailable(dto.name);
    await this.isCodeAvailable(dto.code);

    // Verify head teacher exists if provided
    if (dto.headId) {
      await this.verifyTeacherExists(dto.headId);
    }

    const manager = this.getRepository(entityManager);

    const department = manager.create({
      name: dto.name,
      code: dto.code,
      headId: dto.headId,
      description: dto.description,
      location: dto.location,
      email: dto.email,
      phoneNumber: dto.phoneNumber,
    });

    return manager.save(department);
  }

  /**
   * Get a list of all departments with filtering and pagination
   * @param dto Query parameters
   * @returns Paginated list of departments
   */
  async findAll(dto: GetDepartmentsDto) {
    const queryBuilder =
      this.departmentRepository.createQueryBuilder('department');

    // Apply search filter if query parameter exists
    if (dto.q) {
      queryBuilder.where(
        '(department.name ILIKE :query OR department.code ILIKE :query OR department.description ILIKE :query)',
        { query: `%${dto.q}%` },
      );
    }

    // Include head teacher if requested
    if (dto.includeHead) {
      queryBuilder.leftJoinAndSelect('department.head', 'head');
    }

    // Apply pagination
    queryBuilder
      .skip(dto.skip)
      .take(dto.pageSize || 10)
      .orderBy('department.name', 'ASC');

    const [results, count] = await queryBuilder.getManyAndCount();

    // Include additional counts if requested
    if (dto.includeCoursesCount || dto.includeTeachersCount) {
      // Get all department IDs
      const departmentIds = results.map((department) => department.id);

      // Get courses count for all departments in a single query if requested
      if (dto.includeCoursesCount) {
        const coursesCountQuery = await this.departmentRepository
          .createQueryBuilder('department')
          .select('department.id', 'departmentId')
          .addSelect('COUNT(course.id)', 'count')
          .innerJoin('department.courses', 'course')
          .where('department.id IN (:...ids)', { ids: departmentIds })
          .groupBy('department.id')
          .getRawMany<{ departmentId: string; count: string }>();

        // Create a map of department ID to courses count
        const coursesCountMap = new Map(
          coursesCountQuery.map((item) => [
            item.departmentId,
            parseInt(item.count),
          ]),
        );

        // Assign counts to each department
        results.forEach((department) => {
          department['coursesCount'] = coursesCountMap.get(department.id) || 0;
        });
      }

      // Get teachers count for all departments in a single query if requested
      if (dto.includeTeachersCount) {
        const teachersCountQuery = await this.departmentRepository
          .createQueryBuilder('department')
          .select('department.id', 'departmentId')
          .addSelect('COUNT(teacher.id)', 'count')
          .innerJoin('department.teachers', 'teacher')
          .where('department.id IN (:...ids)', { ids: departmentIds })
          .groupBy('department.id')
          .getRawMany<{ departmentId: string; count: string }>();

        // Create a map of department ID to teachers count
        const teachersCountMap = new Map(
          teachersCountQuery.map((item) => [
            item.departmentId,
            parseInt(item.count),
          ]),
        );

        // Assign counts to each department
        results.forEach((department) => {
          department['teachersCount'] =
            teachersCountMap.get(department.id) || 0;
        });
      }
    }

    return {
      results,
      count,
    };
  }

  /**
   * Get department by ID with optional relationship loading
   * @param dto Department ID and optional parameters
   * @returns The department if found
   * @throws NotFoundException if department not found
   */
  async findOne(dto: GetDepartmentDto): Promise<Department> {
    const queryBuilder = this.departmentRepository
      .createQueryBuilder('department')
      .where('department.id = :id', { id: dto.id });

    // Include head teacher if requested
    if (dto.includeHead) {
      queryBuilder.leftJoinAndSelect('department.head', 'head');
    }

    // Include courses if requested
    if (dto.includeCourses) {
      queryBuilder.leftJoinAndSelect('department.courses', 'course');
    }

    // Include teachers if requested
    if (dto.includeTeachers) {
      queryBuilder.leftJoinAndSelect('department.teachers', 'teacher');
    }

    const department = await queryBuilder.getOne();

    if (!department) {
      throw new NotFoundException(`Department with ID ${dto.id} not found`);
    }

    return department;
  }

  /**
   * Update a department by ID
   * @param id Department ID
   * @param dto Update data
   * @returns The updated department
   * @throws NotFoundException if department not found
   */
  async update(id: string, dto: UpdateDepartmentDto): Promise<Department> {
    // Get existing department
    const department = await this.departmentRepository.findOne({
      where: { id },
    });

    if (!department) {
      throw new NotFoundException(`Department with ID ${id} not found`);
    }

    // Check name availability if name is being updated
    if (dto.name && dto.name !== department.name) {
      await this.isNameAvailable(dto.name, id);
    }

    // Check code availability if code is being updated
    if (dto.code && dto.code !== department.code) {
      await this.isCodeAvailable(dto.code, id);
    }

    // Verify head teacher exists if provided
    if (dto.headId) {
      await this.verifyTeacherExists(dto.headId);
    }

    // Update the department
    const updatedDepartment = this.departmentRepository.merge(department, dto);
    return this.departmentRepository.save(updatedDepartment);
  }

  /**
   * Delete a department by ID
   * @param id Department ID
   * @returns Void
   * @throws NotFoundException if department not found
   */
  async remove(id: string): Promise<void> {
    const department = await this.departmentRepository.findOne({
      where: { id },
      relations: {
        teachers: true,
        courses: true,
      },
    });

    if (!department) {
      throw new NotFoundException(`Department with ID ${id} not found`);
    }

    // Check if department has teachers or courses
    if (department.teachers?.length > 0 || department.courses?.length > 0) {
      throw new Error(
        'Cannot delete department with associated teachers or courses. Remove associations first.',
      );
    }

    await this.departmentRepository.softDelete(id);
  }

  /**
   * Assign a teacher to a department
   * @param departmentId Department ID
   * @param teacherId Teacher ID
   * @returns The updated department
   */
  async assignTeacher(
    departmentId: string,
    teacherId: string,
  ): Promise<Department> {
    const department = await this.departmentRepository.findOne({
      where: { id: departmentId },
      relations: {
        teachers: true,
      },
    });

    if (!department) {
      throw new NotFoundException(
        `Department with ID ${departmentId} not found`,
      );
    }

    const teacher = await this.teacherRepository.findOne({
      where: { id: teacherId },
    });

    if (!teacher) {
      throw new NotFoundException(`Teacher with ID ${teacherId} not found`);
    }

    // Check if teacher is already assigned to department
    if (department.teachers.some((t) => t.id === teacherId)) {
      return department; // Already assigned, return as is
    }

    // Add teacher to department
    department.teachers.push(teacher);
    return this.departmentRepository.save(department);
  }

  /**
   * Remove a teacher from a department
   * @param departmentId Department ID
   * @param teacherId Teacher ID
   * @returns The updated department
   */
  async removeTeacher(
    departmentId: string,
    teacherId: string,
  ): Promise<Department> {
    const department = await this.departmentRepository.findOne({
      where: { id: departmentId },
      relations: {
        teachers: true,
      },
    });

    if (!department) {
      throw new NotFoundException(
        `Department with ID ${departmentId} not found`,
      );
    }

    // Check if teacher is assigned to department
    const teacherIndex = department.teachers.findIndex(
      (t) => t.id === teacherId,
    );

    if (teacherIndex === -1) {
      throw new NotFoundException(
        `Teacher with ID ${teacherId} not found in department ${departmentId}`,
      );
    }

    // Remove teacher from department
    department.teachers.splice(teacherIndex, 1);
    return this.departmentRepository.save(department);
  }

  /**
   * Get all teachers in a department
   * @param departmentId Department ID
   * @returns List of teachers in the department
   */
  async getDepartmentTeachers(departmentId: string): Promise<Teacher[]> {
    const department = await this.departmentRepository.findOne({
      where: { id: departmentId },
      relations: {
        teachers: true,
      },
    });

    if (!department) {
      throw new NotFoundException(
        `Department with ID ${departmentId} not found`,
      );
    }

    return department.teachers;
  }

  /**
   * Set the head of department
   * @param departmentId Department ID
   * @param teacherId Teacher ID
   * @returns The updated department
   */
  async setDepartmentHead(
    departmentId: string,
    teacherId: string,
  ): Promise<Department> {
    const department = await this.departmentRepository.findOne({
      where: { id: departmentId },
    });

    if (!department) {
      throw new NotFoundException(
        `Department with ID ${departmentId} not found`,
      );
    }

    await this.verifyTeacherExists(teacherId);

    // Update department head
    department.headId = teacherId;
    return this.departmentRepository.save(department);
  }

  /**
   * Verify that a department exists by ID
   * @param id Department ID to verify
   * @returns The department if it exists
   * @throws NotFoundException if the department doesn't exist
   */
  async verifyDepartmentExists(id: string): Promise<Department> {
    return this.getOneOrThrow({
      where: { id },
    });
  }

  /**
   * Get a department by ID
   * @param id Department ID
   * @returns The department if it exists
   * @throws NotFoundException if the department doesn't exist
   */
  async getDepartmentById(id: string): Promise<Department> {
    return this.getOneOrThrow({
      where: { id },
    });
  }
}
