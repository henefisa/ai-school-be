import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Student } from 'src/typeorm/entities/student.entity';
import { Repository } from 'typeorm';
import { CreateStudentDto } from './dto/create-student.dto';
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

  async create(dto: CreateStudentDto, file?: Express.Multer.File) {
    return this.studentRepository.manager.transaction(async (entityManager) => {
      // 1. Validate and process parent information
      const parentId = dto.parent.parentId;

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
        firstName: dto.personal.firstName,
        lastName: dto.personal.lastName,
        dob: new Date(dto.personal.dob),
        gender: dto.personal.gender,
        // Contact info
        email: dto.contact.email,
        contactNumber: dto.contact.phone,
        // Academic info
        grade: dto.academic.grade,
        enrollmentDate: dto.academic.enrollmentDate
          ? new Date(dto.academic.enrollmentDate)
          : undefined,
        previousSchool: dto.academic.previousSchool,
        academicYear: dto.academic.academicYear,
        additionalNotes: dto.academic.additionalNotes,
        // Parent reference
        parentId,
      });

      const createdStudent = await entityManager.save(Student, student);

      // 3. Create address
      const address = entityManager.create(Address, {
        addressLine1: dto.contact.street,
        addressLine2: dto.contact.state
          ? `${dto.contact.state}, ${dto.contact.zipCode}`
          : undefined,
        city: dto.contact.city,
        country: dto.contact.country,
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
          username: dto.personal.username,
          email: dto.contact.email,
          studentId: createdStudent.id,
          password: dto.personal.password,
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
