import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Teacher } from 'src/typeorm/entities/teacher.entity';
import { Repository } from 'typeorm';
import { UsersService } from '../users/users.service';
import { CreateTeacherDto } from './dto/create-teacher.dto';
import { Role } from 'src/shared/constants';
import { UpdateTeacherDto } from './dto/update-teacher.dto';
import { GetTeachersDto } from './dto/get-teachers.dto';
import { BaseService } from 'src/shared/base.service';
import { EntityName } from 'src/shared/error-messages';
import { DepartmentsService } from '../departments/departments.service';
import { AddressesService } from '../addresses/addresses.service';
import { CreateAddressDto } from '../addresses/dto/create-address.dto';
import { groupTeacherFormData } from 'src/shared/utils/form-data.utils';
import { ClassAssignment } from 'src/typeorm/entities/class-assignment.entity';
import { Department } from 'src/typeorm/entities/department.entity';
import { TeacherAddress } from 'src/typeorm/entities/teacher-address.entity';
import { StudentAddress } from 'src/typeorm/entities/student-address.entity';
import { Address } from 'src/typeorm/entities/address.entity';
import { ParentAddress } from 'src/typeorm/entities/parent-address.entity';
import { User } from 'src/typeorm/entities/user.entity';
import { GetTeacherDto } from './dto/get-teacher.dto';
import { FileStorageService } from '../../shared/services/file-storage.service';
@Injectable()
export class TeachersService extends BaseService<Teacher> {
  private readonly logger = new Logger(TeachersService.name);
  private readonly uploadsDirectory = 'uploads/teachers';

  constructor(
    @InjectRepository(Teacher)
    private readonly teacherRepository: Repository<Teacher>,
    private readonly usersService: UsersService,
    private readonly departmentsService: DepartmentsService,
    private readonly addressesService: AddressesService,
    private readonly fileStorageService: FileStorageService,
  ) {
    super(EntityName.Teacher, teacherRepository);
  }

  async create(dto: CreateTeacherDto) {
    return this.teacherRepository.manager.transaction(async (entityManager) => {
      // Group form data by prefix
      const groupedData = groupTeacherFormData(dto);

      // Extract teacher data
      const teacherData: Partial<Teacher> = {
        // Personal information
        firstName: groupedData.personal.firstName,
        lastName: groupedData.personal.lastName,
        dob: new Date(groupedData.personal.dob),
        gender: groupedData.personal.gender,

        // Contact information
        email: groupedData.contact.email,
        contactNumber: groupedData.contact.phoneNumber,

        // Professional information
        departmentId: groupedData.professional.departmentId,
        hireDate: new Date(groupedData.professional.joinDate),
      };

      // Get photo URL if a photo was uploaded
      const photoUrl = this.getPhotoUrl(dto['personal.photo']);

      // Verify department exists if departmentId is provided
      if (teacherData.departmentId) {
        await this.departmentsService.verifyDepartmentExists(
          teacherData.departmentId,
        );
      }

      // Create and save teacher
      const teacher = this.teacherRepository.create(teacherData);
      const createdTeacher = await entityManager.save(Teacher, teacher);

      // Check email availability and create user account for the teacher
      if (groupedData.contact.email) {
        await this.usersService.isEmailAvailable(groupedData.contact.email);
      }
      await this.usersService.create(
        {
          username: groupedData.personal.username,
          email: groupedData.contact.email,
          teacherId: createdTeacher.id,
          password: groupedData.personal.password,
          role: Role.Teacher,
          photoUrl: photoUrl,
        },
        entityManager,
      );

      // Create address using AddressesService
      const addressDto: CreateAddressDto = {
        street: groupedData.contact.street,
        city: groupedData.contact.city,
        state: groupedData.contact.state,
        zipCode: groupedData.contact.zipCode,
        country: groupedData.contact.country,
      };

      const savedAddress = await this.addressesService.create(
        addressDto,
        entityManager,
      );

      // Associate address with teacher
      await this.addressesService.associateWithTeacher(
        savedAddress.id,
        createdTeacher.id,
        groupedData.contact.addressType || 'Primary',
        entityManager,
      );

      return createdTeacher;
    });
  }

  async update(id: string, dto: UpdateTeacherDto) {
    return this.teacherRepository.manager.transaction(async (entityManager) => {
      // Group form data by prefix
      const groupedData = groupTeacherFormData(dto);

      // Verify department exists if departmentId is provided
      if (groupedData.professional?.departmentId) {
        await this.departmentsService.verifyDepartmentExists(
          groupedData.professional.departmentId,
        );
      }

      const teacher = await this.getOneOrThrow({
        where: { id },
      });

      // Extract teacher data to update
      const teacherData: Partial<Teacher> = {};

      // Personal information
      if (groupedData.personal) {
        if (groupedData.personal.firstName)
          teacherData.firstName = groupedData.personal.firstName;
        if (groupedData.personal.lastName)
          teacherData.lastName = groupedData.personal.lastName;
        if (groupedData.personal.dob)
          teacherData.dob = new Date(groupedData.personal.dob);
        if (groupedData.personal.gender)
          teacherData.gender = groupedData.personal.gender;
      }

      // Contact information
      if (groupedData.contact) {
        if (groupedData.contact.email)
          teacherData.email = groupedData.contact.email;
        if (groupedData.contact.phoneNumber)
          teacherData.contactNumber = groupedData.contact.phoneNumber;
      }

      // Professional information
      if (groupedData.professional) {
        if (groupedData.professional.departmentId)
          teacherData.departmentId = groupedData.professional.departmentId;
        if (groupedData.professional.joinDate)
          teacherData.hireDate = new Date(groupedData.professional.joinDate);
      }

      // Apply updates to teacher
      Object.assign(teacher, teacherData);
      const updatedTeacher = await entityManager.save(Teacher, teacher);

      return updatedTeacher;
    });
  }

  async delete(id: string) {
    return this.teacherRepository.manager.transaction(async (entityManager) => {
      // 1. Find the teacher with related entities to ensure it exists and gather related info
      const teacher = await this.getOneOrThrow({
        where: { id },
        relations: {
          user: true,
          teacherAddresses: {
            address: true,
          },
          assignments: true,
        },
      });

      // 2. Delete the teacher's photo if it exists
      if (teacher.user?.photoUrl) {
        const filename = teacher.user.photoUrl.split('/').pop();
        if (filename) {
          const result = this.fileStorageService.deleteFile(
            filename,
            this.uploadsDirectory,
          );
          if (!result.success) {
            this.logger.warn(
              `Failed to delete file ${filename}: ${result.error}`,
            );
          }
        }
      }

      // 3. Soft delete related user record
      if (teacher.user) {
        await entityManager.softDelete(User, { id: teacher.user.id });
      }

      // 4. Delete teacher-address relationships and orphaned addresses
      if (teacher.teacherAddresses?.length > 0) {
        // Get all address IDs associated with this teacher
        const addressIds = teacher.teacherAddresses.map((ta) => ta.addressId);

        // Delete teacher-address relationships
        await entityManager.softDelete(TeacherAddress, { teacherId: id });

        // Check and delete addresses that are no longer referenced
        for (const addressId of addressIds) {
          const addressInUse = await entityManager.count(TeacherAddress, {
            where: { addressId },
          });

          const addressUsedByStudent = await entityManager.count(
            StudentAddress,
            {
              where: { addressId },
            },
          );

          const addressUsedByParent = await entityManager.count(ParentAddress, {
            where: { addressId },
          });

          // If address is not used by any other entity, soft delete it
          if (
            addressInUse === 0 &&
            addressUsedByStudent === 0 &&
            addressUsedByParent === 0
          ) {
            await entityManager.softDelete(Address, { id: addressId });
          }
        }
      }

      // 5. Soft delete related class assignments
      if (teacher.assignments?.length > 0) {
        await entityManager.softDelete(ClassAssignment, { teacherId: id });
      }

      // 6. If this teacher is a department head, nullify the references
      await entityManager.update(Department, { headId: id }, { headId: null });

      // 8. Finally, soft delete the teacher record
      await entityManager.softDelete(Teacher, { id });
    });
  }

  async getTeachers(dto: GetTeachersDto) {
    const queryBuilder = this.teacherRepository
      .createQueryBuilder('teacher')
      .leftJoinAndSelect('teacher.user', 'user')
      .skip(dto.skip)
      .take(dto.pageSize ?? 10);

    // Conditionally join departments based on includedDepartments parameter
    if (dto.includedDepartments) {
      queryBuilder.leftJoinAndSelect('teacher.departments', 'departments');
    }

    if (dto.q) {
      queryBuilder.andWhere(
        '(LOWER(teacher.firstName) LIKE LOWER(:query) OR LOWER(teacher.lastName) LIKE LOWER(:query))',
        { query: `%${dto.q}%` },
      );
    }

    if (dto.status !== undefined) {
      queryBuilder.andWhere('user.isActive = :isActive', {
        isActive: dto.status,
      });
    }

    const [results, count] = await queryBuilder.getManyAndCount();

    return {
      results,
      count,
    };
  }

  /**
   * Get a teacher by ID with related address information
   * @param id Teacher ID to retrieve
   * @returns Teacher object with related addresses
   */
  async getTeacherById(id: string, dto: GetTeacherDto): Promise<Teacher> {
    return this.getOneOrThrow({
      where: { id },
      relations: {
        departments: dto.includeDepartments,
        teacherAddresses: dto.includeTeacherAddresses
          ? {
              address: true,
            }
          : undefined,
        user: dto.includeUser,
      },
    });
  }

  /**
   * Gets the URL for an uploaded photo
   * @param file - The uploaded file object
   * @returns The URL for the file or undefined if the file is invalid
   */
  private getPhotoUrl(file?: Express.Multer.File): string | undefined {
    return this.fileStorageService.getFileUrl(file, {
      basePath: '/uploads/teachers',
    });
  }
}
