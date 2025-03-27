import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Student } from 'src/typeorm/entities/student.entity';
import { Repository } from 'typeorm';
import {
  CreateStudentDto,
  CreateStudentFormDto,
} from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { GetStudentsDto } from './dto/get-students.dto';
import { UsersService } from '../users/users.service';
import { Role } from 'src/shared/constants';
import { BaseService } from 'src/shared/base.service';
import { EntityName, ERROR_MESSAGES } from 'src/shared/error-messages';
import { Parent } from 'src/typeorm/entities/parent.entity';
import { Address } from 'src/typeorm/entities/address.entity';
import { StudentAddress } from 'src/typeorm/entities/student-address.entity';

@Injectable()
export class StudentsService extends BaseService<Student> {
  constructor(
    @InjectRepository(Student)
    private readonly studentRepository: Repository<Student>,
    @InjectRepository(Parent)
    private readonly parentRepository: Repository<Parent>,
    private readonly usersService: UsersService,
  ) {
    super(EntityName.Student, studentRepository);
  }

  async create(dto: CreateStudentDto) {
    return this.studentRepository.manager.transaction(async (entityManager) => {
      const student = this.studentRepository.create(dto);
      const createdStudent = await entityManager.save(Student, student);

      await this.usersService.create(
        {
          username: dto.username,
          email: dto.email,
          studentId: createdStudent.id,
          password: dto.password,
          role: Role.Student,
        },
        entityManager,
      );

      return createdStudent;
    });
  }

  async processStudentForm(
    formData: CreateStudentFormDto,
    file?: Express.Multer.File,
  ) {
    return this.studentRepository.manager.transaction(async (entityManager) => {
      // 1. Validate and process parent information
      const parentId = formData.parent.parentId;

      // Check if parent exists
      const parentExists = await this.parentRepository.findOne({
        where: { id: parentId },
      });

      if (!parentExists) {
        throw new NotFoundException(ERROR_MESSAGES.notFound(EntityName.Parent));
      }

      // 2. Create the student record
      const student = entityManager.create(Student, {
        // Personal info
        firstName: formData.personal.firstName,
        lastName: formData.personal.lastName,
        dob: new Date(formData.personal.dob),
        gender: formData.personal.gender,
        // Contact info
        email: formData.contact.email,
        contactNumber: formData.contact.phone,
        // Academic info
        grade: formData.academic.grade,
        enrollmentDate: formData.academic.enrollmentDate
          ? new Date(formData.academic.enrollmentDate)
          : undefined,
        previousSchool: formData.academic.previousSchool,
        academicYear: formData.academic.academicYear,
        additionalNotes: formData.academic.additionalNotes,
        // Parent reference
        parentId,
      });

      const createdStudent = await entityManager.save(Student, student);

      // 3. Create address
      const address = entityManager.create(Address, {
        addressLine1: formData.contact.street,
        addressLine2: formData.contact.state
          ? `${formData.contact.state}, ${formData.contact.zipCode}`
          : undefined,
        city: formData.contact.city || undefined,
        country: formData.contact.country || undefined,
      });

      const savedAddress = await entityManager.save(Address, address);

      // 4. Create student-address relationship
      const studentAddress = entityManager.create(StudentAddress, {
        studentId: createdStudent.id,
        addressId: savedAddress.id,
        addressType: 'Home',
      });

      await entityManager.save(StudentAddress, studentAddress);

      // 5. Create user account
      await this.usersService.create(
        {
          username: formData.personal.username,
          email: formData.contact.email,
          studentId: createdStudent.id,
          password: formData.personal.password,
          role: Role.Student,
          photoUrl: this.getPhotoUrl(file),
        },
        entityManager,
      );

      return createdStudent;
    });
  }

  private getPhotoUrl(file?: Express.Multer.File): string | undefined {
    if (!file) {
      return undefined;
    }

    if (typeof file === 'object' && file !== null && 'filename' in file) {
      return `/uploads/students/${file.filename}`;
    }

    return undefined;
  }

  async update(id: string, dto: UpdateStudentDto) {
    const student = await this.getOneOrThrow({
      where: {
        id,
      },
    });

    Object.assign(student, dto);

    return this.studentRepository.save(student);
  }

  async delete(id: string) {
    await this.studentRepository.softDelete({ id });
  }

  async getStudents(dto: GetStudentsDto) {
    const [results, count] = await this.studentRepository.findAndCount({
      skip: (dto.page ?? 1 - 1) * (dto.pageSize ?? 10),
      take: dto.pageSize ?? 10,
    });

    return {
      results,
      count,
    };
  }
}
