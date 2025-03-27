import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Student } from 'src/typeorm/entities/student.entity';
import { Repository } from 'typeorm';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { GetStudentsDto } from './dto/get-students.dto';
import { UsersService } from '../users/users.service';
import { Role } from 'src/shared/constants';
import { BaseService } from 'src/shared/base.service';
import { EntityName } from 'src/shared/error-messages';

@Injectable()
export class StudentsService extends BaseService<Student> {
  constructor(
    @InjectRepository(Student)
    private readonly studentRepository: Repository<Student>,
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
