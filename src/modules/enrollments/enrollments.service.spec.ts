import { Test, TestingModule } from '@nestjs/testing';
import { EnrollmentsService } from './enrollments.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Enrollment } from 'src/typeorm/entities/enrollment.entity';
import { Repository } from 'typeorm';
import { BadRequestException } from 'src/shared/exceptions/bad-request.exception';
import { EntityName } from 'src/shared/error-messages';
import { NotFoundException } from 'src/shared/exceptions/not-found.exception';

const createEnrollment = (id: string) => {
  const enrollment = new Enrollment();
  enrollment.id = id;
  enrollment.classId = `classId ${id}`;
  enrollment.studentId = `studentId ${id}`;

  return enrollment;
};

const oneEnrollment = createEnrollment('a uuid');
const arrayErollment = [...Array(3)].map((_, index) =>
  createEnrollment(`${index}`),
);

describe('EnrollmentsService', () => {
  let service: EnrollmentsService;
  let enrollmentRepository: Repository<Enrollment>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EnrollmentsService,
        {
          provide: getRepositoryToken(Enrollment),
          useValue: {
            findAndCount: jest
              .fn()
              .mockResolvedValue([arrayErollment, arrayErollment.length]),
            findOne: jest.fn().mockResolvedValue(oneEnrollment),
            save: jest.fn().mockResolvedValue(oneEnrollment),
            delete: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<EnrollmentsService>(EnrollmentsService);
    enrollmentRepository = module.get<Repository<Enrollment>>(
      getRepositoryToken(Enrollment),
    );
  });

  it('EnrollmentsService should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getEnrollments', () => {
    it('should return a paginated list of enrollments', async () => {
      const dto = { page: 1, pageSize: 10 };
      const result = await service.getEnrollments(dto);

      expect(enrollmentRepository.findAndCount).toHaveBeenCalledWith({
        skip: (dto.page - 1) * dto.pageSize,
        take: dto.pageSize,
      });
      expect(result).toEqual({
        results: arrayErollment,
        count: arrayErollment.length,
      });
    });
  });

  describe('isEnrollmentOfStudentExist', () => {
    it('should return true if enrollment exists', async () => {
      const result = await service.isEnrollmentAvailable(
        oneEnrollment.studentId,
        oneEnrollment.classId,
      );

      expect(enrollmentRepository.findOne).toHaveBeenCalledWith({
        where: {
          studentId: oneEnrollment.studentId,
          classId: oneEnrollment.classId,
        },
      });
      expect(result).toBe(true);
    });

    it('should return false if enrollment does not exist', async () => {
      const enrollmentRepositorySpy = jest
        .spyOn(enrollmentRepository, 'findOne')
        .mockResolvedValue(null);

      const result = await service.isEnrollmentAvailable(
        oneEnrollment.studentId,
        oneEnrollment.classId,
      );

      expect(enrollmentRepositorySpy).toHaveBeenCalledWith({
        where: {
          studentId: oneEnrollment.studentId,
          classId: oneEnrollment.classId,
        },
      });
      expect(result).toBe(false);
    });
  });

  describe('register', () => {
    it('should create a new enrollment', async () => {
      const dto = { classId: oneEnrollment.classId };
      const serviceSpy = jest
        .spyOn(service, 'isEnrollmentAvailable')
        .mockResolvedValue(false);

      const result = await service.register(oneEnrollment.studentId, dto);

      expect(serviceSpy).toHaveBeenCalledWith(
        oneEnrollment.studentId,
        dto.classId,
      );
      expect(enrollmentRepository.save).toHaveBeenCalledWith({
        studentId: oneEnrollment.studentId,
        classId: dto.classId,
      });
      expect(result).toEqual(oneEnrollment);
    });

    it('should throw BadRequestException if enrollment already exists', async () => {
      const dto = { classId: oneEnrollment.classId };

      jest.spyOn(service, 'isEnrollmentAvailable').mockResolvedValue(true);

      await expect(
        service.register(oneEnrollment.studentId, dto),
      ).rejects.toThrowError(new BadRequestException(EntityName.Enrollment));
    });
  });

  describe('delete', () => {
    it('should delete an enrollment', async () => {
      await service.delete(oneEnrollment.studentId, oneEnrollment.id);

      expect(enrollmentRepository.findOne).toHaveBeenCalledWith({
        where: { id: oneEnrollment.id, studentId: oneEnrollment.studentId },
      });
      expect(enrollmentRepository.delete).toHaveBeenCalledWith({
        id: oneEnrollment.id,
      });
    });

    it('should throw BadRequestException if enrollment not found', async () => {
      jest.spyOn(enrollmentRepository, 'findOne').mockResolvedValue(null);

      await expect(
        service.delete(oneEnrollment.studentId, oneEnrollment.id),
      ).rejects.toThrowError(new NotFoundException(EntityName.Enrollment));
    });
  });
});
