import { Injectable } from '@nestjs/common';
import { BaseService } from 'src/shared/base.service';
import { Enrollment } from 'src/typeorm/entities/enrollment.entity';
import { GetEnrollmentsDto } from './dto/get-enrollment.dto';
import { Repository } from 'typeorm';
import { EntityName } from 'src/shared/error-messages';
import { RegisterEnrollmentDto } from './dto/register-enrollment.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { BadRequestException } from 'src/shared/exceptions/bad-request.exception';

@Injectable()
export class EnrollmentsService extends BaseService<Enrollment> {
  constructor(
    @InjectRepository(Enrollment)
    private readonly enrollmentRepository: Repository<Enrollment>,
  ) {
    super(EntityName.Enrollment, enrollmentRepository);
  }

  async getEnrollments(dto: GetEnrollmentsDto) {
    const [results, count] = await this.enrollmentRepository.findAndCount({
      skip: (dto.page ?? 1 - 1) * (dto.pageSize ?? 10),
      take: dto.pageSize ?? 10,
      relations: {
        attendances: true,
        classRoom: {
          course: true,
        },
      },
    });

    return {
      results,
      count,
    };
  }

  async isEnrollmentAvailable(studentId: string, classId: string) {
    const enrollment = await this.getOne({
      where: {
        studentId,
        classId,
      },
    });

    return Boolean(enrollment);
  }

  async register(studentId: string, dto: RegisterEnrollmentDto) {
    const isEnrollmentExist = await this.isEnrollmentAvailable(
      studentId,
      dto.classId,
    );

    if (isEnrollmentExist) {
      throw new BadRequestException(EntityName.Enrollment);
    }

    return await this.enrollmentRepository.save({
      studentId: studentId,
      classId: dto.classId,
    });
  }

  async delete(studentId: string, enrollmentId: string) {
    await this.getOneOrThrow({
      where: {
        id: enrollmentId,
        studentId,
      },
    });

    await this.enrollmentRepository.delete({ id: enrollmentId });
  }
}
