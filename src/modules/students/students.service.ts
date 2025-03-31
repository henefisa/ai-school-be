import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
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
import { Address } from 'src/typeorm/entities/address.entity';
import { StudentAddress } from 'src/typeorm/entities/student-address.entity';
import { groupStudentFormData } from 'src/shared/utils/form-data.utils';
import { ParentsService } from '../parents/parents.service';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class StudentsService extends BaseService<Student> {
  constructor(
    @InjectRepository(Student)
    private readonly studentRepository: Repository<Student>,
    private readonly parentsService: ParentsService,
    private readonly usersService: UsersService,
  ) {
    super(EntityName.Student, studentRepository);
  }

  async create(dto: CreateStudentDto) {
    // Keep track of the uploaded file to delete if there's an error
    let uploadedFile: Express.Multer.File | undefined = dto['personal.photo'];

    try {
      return await this.studentRepository.manager.transaction(
        async (entityManager) => {
          // Group form data by prefixes for easier access
          const groupedData = groupStudentFormData(dto);

          // 1. Validate and process parent information
          const parentId = groupedData.parent.parentId;

          await this.parentsService
            .getOneOrThrow({
              where: { id: parentId },
            })
            .catch(() => {
              throw new NotFoundException(
                ERROR_MESSAGES.notFound(EntityName.Parent),
              );
            });

          // 2. Create the student record
          const student = entityManager.create(Student, {
            // Personal info
            firstName: groupedData.personal.firstName,
            lastName: groupedData.personal.lastName,
            dob: new Date(groupedData.personal.dob),
            gender: groupedData.personal.gender,
            // Contact info
            email: groupedData.contact.email,
            contactNumber: groupedData.contact.phone,
            // Academic info
            grade: groupedData.academic.grade,
            enrollmentDate: groupedData.academic.enrollmentDate
              ? new Date(groupedData.academic.enrollmentDate)
              : undefined,
            previousSchool: groupedData.academic.previousSchool,
            academicYear: groupedData.academic.academicYear,
            additionalNotes: groupedData.academic.additionalNotes,
            // Parent reference
            parentId,
          });

          const createdStudent = await entityManager.save(Student, student);

          // 3. Create address
          const address = entityManager.create(Address, {
            addressLine1: groupedData.contact.street,
            addressLine2: groupedData.contact.state
              ? `${groupedData.contact.state}, ${groupedData.contact.zipCode}`
              : undefined,
            city: groupedData.contact.city,
            country: groupedData.contact.country,
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
              username: groupedData.personal.username,
              email: groupedData.contact.email,
              studentId: createdStudent.id,
              password: groupedData.personal.password,
              role: Role.Student,
              photoUrl: this.getPhotoUrl(dto['personal.photo']),
            },
            entityManager,
          );

          // Successfully completed - don't delete the file
          uploadedFile = undefined;

          return createdStudent;
        },
      );
    } catch (error) {
      // If there was an error and we have an uploaded file, delete it
      if (uploadedFile && 'filename' in uploadedFile) {
        this.deleteUploadedFile(uploadedFile.filename);
      }

      throw error;
    }
  }

  /**
   * Deletes an uploaded file from the filesystem
   */
  private deleteUploadedFile(filename: string): void {
    try {
      const filePath = path.join(process.cwd(), 'uploads/students', filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (error) {
      // Log the error but don't throw - this is cleanup code
      console.error('Error deleting uploaded file:', error);
    }
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
    const queryBuilder = this.studentRepository
      .createQueryBuilder('student')
      .leftJoinAndSelect('student.user', 'user')
      .skip(((dto.page ?? 1) - 1) * (dto.pageSize ?? 10))
      .take(dto.pageSize ?? 10);

    if (dto.q) {
      queryBuilder.andWhere(
        '(LOWER(student.firstName) LIKE LOWER(:query) OR LOWER(student.lastName) LIKE LOWER(:query))',
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
   * Update a student's photo
   * Students can only update their own photo, admins can update any photo
   */
  async updatePhoto(
    studentId: string,
    photo: Express.Multer.File,
    userId: string,
    canUpdateAnyPhoto: boolean,
  ) {
    // Keep track of the uploaded file to delete if there's an error
    let uploadedFile: Express.Multer.File | undefined = photo;

    try {
      // Get the student with relationship to user
      const student = await this.getOneOrThrow({
        where: { id: studentId },
        relations: {
          user: true,
        },
      });

      // Check if user has permission to update this photo
      if (!canUpdateAnyPhoto) {
        // Get the user associated with this student
        if (!student.user || student.user.id !== userId) {
          throw new ForbiddenException('You can only update your own photo');
        }
      }

      // Validate the photo file
      if (!photo) {
        throw new BadRequestException('No photo file provided');
      }

      // Update the user photo URL
      if (student.user) {
        const photoUrl = this.getPhotoUrl(photo);

        await this.usersService.update(student.user.id, { photoUrl });

        // Successfully completed - don't delete the file
        uploadedFile = undefined;

        // Return updated student with user info
        return this.getOneOrThrow({
          where: { id: studentId },
          relations: ['user'],
        });
      }

      throw new NotFoundException(
        'This student record has no associated user account',
      );
    } catch (error) {
      // If there was an error and we have an uploaded file, delete it
      if (uploadedFile && 'filename' in uploadedFile) {
        this.deleteUploadedFile(uploadedFile.filename);
      }
      throw error;
    }
  }
}
