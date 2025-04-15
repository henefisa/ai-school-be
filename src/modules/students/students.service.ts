import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
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
import { User } from 'src/typeorm/entities/user.entity';
import { Not, In } from 'typeorm';
import { ParentAddress } from 'src/typeorm/entities/parent-address.entity';
import { Attendance } from 'src/typeorm/entities/attendance.entity';
import { Grade } from 'src/typeorm/entities/grade.entity';
import { Enrollment } from 'src/typeorm/entities/enrollment.entity';
import { FileStorageService } from '../../shared/services/file-storage.service';

@Injectable()
export class StudentsService extends BaseService<Student> {
  private readonly logger = new Logger(StudentsService.name);
  private readonly uploadsDirectory = 'uploads/students';

  constructor(
    @InjectRepository(Student)
    private readonly studentRepository: Repository<Student>,
    private readonly parentsService: ParentsService,
    private readonly usersService: UsersService,
    private readonly fileStorageService: FileStorageService,
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
            street: groupedData.contact.street,
            state: groupedData.contact.state,
            zipCode: groupedData.contact.zipCode,
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

          // 5. Check email availability and create user account
          if (groupedData.contact.email) {
            await this.usersService.isEmailAvailable(groupedData.contact.email);
          }
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
   * @param filename - The name of the file to delete
   */
  private deleteUploadedFile(filename: string): void {
    const result = this.fileStorageService.deleteFile(
      filename,
      this.uploadsDirectory,
    );
    if (!result.success) {
      this.logger.warn(`Failed to delete file ${filename}: ${result.error}`);
    }
  }

  /**
   * Gets the URL for an uploaded photo
   * @param file - The uploaded file object
   * @returns The URL for the file or undefined if the file is invalid
   */
  private getPhotoUrl(file?: Express.Multer.File): string | undefined {
    return this.fileStorageService.getFileUrl(file, {
      basePath: '/uploads/students',
    });
  }

  async update(id: string, dto: UpdateStudentDto) {
    // Find the student with their current data
    const student = await this.getOneOrThrow({
      where: {
        id,
      },
      relations: {
        user: true,
      },
    });

    const { email, ...studentUpdateData } = dto;

    // If email is being updated, update the associated user account
    if (email) {
      if (!student.user) {
        throw new NotFoundException(
          'This student record has no associated user account',
        );
      }

      const userUpdateData: Partial<User> = {};

      if (email) {
        userUpdateData.email = email;
        // Also update the student's email directly
        student.email = email;
      }

      // Update user account if needed
      if (Object.keys(userUpdateData).length > 0) {
        await this.usersService.update(student.user.id, userUpdateData);
      }
    }

    // Apply the updates to the student object
    Object.assign(student, studentUpdateData);

    // Save the updated student
    const updatedStudent = await this.studentRepository.save(student);

    return this.getOneOrThrow({
      where: { id: updatedStudent.id },
      relations: {
        user: true,
        studentAddresses: {
          address: true,
        },
      },
    });
  }

  async delete(id: string) {
    return this.studentRepository.manager.transaction(async (entityManager) => {
      // 1. Find the student with user info to check for photo URL
      const student = await this.getOneOrThrow({
        where: { id },
        relations: {
          user: true,
          studentAddresses: {
            address: true,
          },
          enrollments: true,
        },
      });

      // 2. Delete the student's photo if it exists
      if (student.user?.photoUrl) {
        const filename = student.user.photoUrl.split('/').pop();
        if (filename) {
          this.deleteUploadedFile(filename);
        }
      }

      // 3. Delete related user record
      if (student.user) {
        await entityManager.softDelete(User, { id: student.user.id });
      }

      // 4. Delete all student-address relationships
      if (student.studentAddresses?.length > 0) {
        // Get all address IDs associated with this student
        const addressIds = student.studentAddresses.map((sa) => sa.addressId);

        // Delete student-address relationships
        await entityManager.softDelete(StudentAddress, { studentId: id });

        // Delete addresses that are only used by this student
        // We need to check if each address is used by any other student or parent
        for (const addressId of addressIds) {
          const addressInUse = await entityManager.count(StudentAddress, {
            where: {
              addressId,
              studentId: Not(id),
            },
          });

          // Check if the address is used by any parent
          const addressUsedByParent = await entityManager
            .createQueryBuilder(ParentAddress, 'pa')
            .where('pa.address_id = :addressId', { addressId })
            .getCount();

          // If address is not used by any other entity, delete it
          if (addressInUse === 0 && addressUsedByParent === 0) {
            await entityManager.softDelete(Address, { id: addressId });
          }
        }
      }

      // 5. Delete all enrollments associated with this student
      if (student.enrollments?.length > 0) {
        const enrollmentIds = student.enrollments.map((e) => e.id);

        // Delete associated attendance records
        await entityManager.softDelete(Attendance, {
          enrollmentId: In(enrollmentIds),
        });

        // Delete associated grade records
        await entityManager.softDelete(Grade, {
          enrollmentId: In(enrollmentIds),
        });

        // Delete the enrollments
        await entityManager.softDelete(Enrollment, {
          studentId: id,
        });
      }

      // 6. Finally, soft delete the student record
      await entityManager.softDelete(Student, { id });
    });
  }

  async getStudents(dto: GetStudentsDto) {
    const queryBuilder = this.studentRepository
      .createQueryBuilder('student')
      .leftJoinAndSelect('student.user', 'user')
      .skip(dto.skip)
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

  /**
   * Get all students associated with a parent ID
   * @param parentId The parent ID to look up students for
   * @returns Array of students for the specified parent
   */
  async getStudentsByParentId(parentId: string): Promise<Student[]> {
    return this.studentRepository
      .createQueryBuilder('student')
      .leftJoinAndSelect('student.user', 'user')
      .where('student.parent_id = :parentId', { parentId })
      .getMany();
  }
}
