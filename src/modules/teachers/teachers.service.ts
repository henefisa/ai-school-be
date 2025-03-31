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
      // Verify department exists if departmentId is provided
      if (dto.departmentId) {
        await this.departmentsService.verifyDepartmentExists(dto.departmentId);
      }

      const teacher = this.teacherRepository.create(dto);
      const createdTeacher = await entityManager.save(Teacher, teacher);

      // Create user account for the teacher
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

      // Handle teacher's address
      const addressDto: CreateAddressDto = {
        addressLine1: dto.address.addressLine1,
        addressLine2: dto.address.addressLine2,
        city: dto.address.city,
        country: dto.address.country,
      };

      const savedAddress = await this.addressesService.create(
        addressDto,
        entityManager,
      );

      // Associate address with teacher
      await this.addressesService.associateWithTeacher(
        savedAddress.id,
        createdTeacher.id,
        'Primary',
        entityManager,
      );

      return createdTeacher;
    });
  }

  async update(id: string, dto: UpdateTeacherDto) {
    // Verify department exists if departmentId is provided
    if (dto.departmentId) {
      await this.departmentsService.verifyDepartmentExists(dto.departmentId);
    }

    const teacher = await this.getOneOrThrow({
      where: { id },
      relations: {
        teacherAddresses: {
          address: true,
        },
      },
    });

    Object.assign(teacher, dto);

    // Handle address update if provided
    if (dto.address) {
      const teacherAddresses =
        await this.addressesService.getAddressesForTeacher(id);
      const existingAddress = teacherAddresses[0];

      if (existingAddress) {
        // Update existing address
        await this.addressesService.update(existingAddress.id, {
          addressLine1: dto.address.addressLine1,
          addressLine2: dto.address.addressLine2,
          city: dto.address.city,
          country: dto.address.country,
        });
      } else {
        // Create new address
        const addressDto: CreateAddressDto = {
          addressLine1: dto.address.addressLine1 || '',
          addressLine2: dto.address.addressLine2,
          city: dto.address.city,
          country: dto.address.country,
        };

        const savedAddress = await this.addressesService.create(addressDto);

        // Associate address with teacher
        await this.addressesService.associateWithTeacher(
          savedAddress.id,
          teacher.id,
          'Primary',
        );
      }
    }

    return this.teacherRepository.save(teacher);
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
