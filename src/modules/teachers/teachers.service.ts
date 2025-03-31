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
import { DepartmentsService } from '../departments/departments.service';
import { AddressesService } from '../addresses/addresses.service';
import { CreateAddressDto } from '../addresses/dto/create-address.dto';
import { groupTeacherFormData } from 'src/shared/utils/form-data.utils';

@Injectable()
export class TeachersService extends BaseService<Teacher> {
  constructor(
    @InjectRepository(Teacher)
    private readonly teacherRepository: Repository<Teacher>,
    private readonly usersService: UsersService,
    private readonly departmentsService: DepartmentsService,
    private readonly addressesService: AddressesService,
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

      // Handle photo data
      if (groupedData.personal.photo) {
        const photoFile = groupedData.personal.photo as unknown as {
          filename?: string;
        };

        if (photoFile && photoFile.filename) {
          // Store the filename in a custom field or metadata if needed
          // Note: Teacher entity doesn't have a photo field by default
        }
      }

      // Verify department exists if departmentId is provided
      if (teacherData.departmentId) {
        await this.departmentsService.verifyDepartmentExists(
          teacherData.departmentId,
        );
      }

      // Create and save teacher
      const teacher = this.teacherRepository.create(teacherData);
      const createdTeacher = await entityManager.save(Teacher, teacher);

      // Create user account for the teacher
      await this.usersService.create(
        {
          username: groupedData.personal.username,
          email: groupedData.contact.email,
          teacherId: createdTeacher.id,
          password: groupedData.personal.password,
          role: Role.Teacher,
        },
        entityManager,
      );

      // Create address using AddressesService
      const addressDto: CreateAddressDto = {
        addressLine1: groupedData.contact.addressLine1 || '',
        addressLine2: groupedData.contact.addressLine2,
        city: groupedData.contact.city,
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
    await this.teacherRepository.softDelete({ id });
  }

  async getTeachers(dto: GetTeachersDto) {
    const [results, count] = await this.teacherRepository.findAndCount({
      skip: dto.skip,
      take: dto.pageSize ?? 10,
    });

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
  async getTeacherById(id: string): Promise<Teacher> {
    return this.getOneOrThrow({
      where: { id },
      relations: ['teacherAddresses', 'teacherAddresses.address', 'user'],
    });
  }
}
