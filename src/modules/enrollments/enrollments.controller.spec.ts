import { Test, TestingModule } from '@nestjs/testing';
import { EnrollmentsController } from './enrollments.controller';
import { EnrollmentsService } from './enrollments.service';
import { GetEnrollmentsDto } from './dto/get-enrollment.dto';
import { Enrollment } from 'src/typeorm/entities/enrollment.entity';
import { RegisterEnrollmentDto } from './dto/register-enrollment.dto';
import { User } from 'src/typeorm/entities/user.entity';
import { Request } from 'express';

interface RequestWithUser extends Request {
  user: User;
}

const createUser = (id: string) => {
  const user = new User();
  user.id = id;
  user.studentId = `studentId ${id}`;

  return user;
};

const oneUser = createUser('a uuid');

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

describe('EnrollmentsController', () => {
  let controller: EnrollmentsController;
  let enrollmentsService: EnrollmentsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EnrollmentsController],
      providers: [
        {
          provide: EnrollmentsService,
          useValue: {
            getEnrollments: jest.fn().mockResolvedValue({
              results: arrayErollment,
              count: arrayErollment.length,
            }),
            register: jest.fn().mockResolvedValue(oneEnrollment),
            delete: jest.fn().mockResolvedValue(null),
          },
        },
      ],
    }).compile();

    controller = module.get<EnrollmentsController>(EnrollmentsController);
    enrollmentsService = module.get<EnrollmentsService>(EnrollmentsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getEnrollments', () => {
    it('should return a paginated list of enrollments', async () => {
      const dto: GetEnrollmentsDto = { page: 1, pageSize: 10 };
      const result = await controller.getEnrolments(dto);

      expect(enrollmentsService.getEnrollments).toHaveBeenCalledWith(dto);
      expect(result).toEqual({
        results: arrayErollment,
        count: arrayErollment.length,
      });
    });
  });

  describe('register', () => {
    it('should register a new enrollment', async () => {
      const dto: RegisterEnrollmentDto = { classId: oneEnrollment.classId };
      const req = { user: oneUser } as RequestWithUser;

      const result = await controller.register(req, dto);

      expect(enrollmentsService.register).toHaveBeenCalledWith(
        oneUser.studentId,
        dto,
      );
      expect(result).toEqual(oneEnrollment);
    });
  });

  describe('delete', () => {
    it('should delete an enrollment', async () => {
      const req = { user: oneUser } as RequestWithUser;

      await controller.delete(req, oneEnrollment.id);

      expect(enrollmentsService.delete).toHaveBeenCalledWith(
        oneUser.studentId,
        oneEnrollment.id,
      );
    });
  });
});
