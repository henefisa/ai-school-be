import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, Between, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { AttendancesService } from './attendances.service';
import { Attendance } from 'src/typeorm/entities/attendance.entity';
import { EnrollmentsService } from '../enrollments/enrollments.service';
import { CreateAttendanceDto } from './dto/create-attendance.dto';
import { UpdateAttendanceDto } from './dto/update-attendance.dto';
import { GetAttendancesDto } from './dto/get-attendances.dto';
import { AttendanceStatus } from 'src/shared/constants';
import { Enrollment } from 'src/typeorm/entities/enrollment.entity';
import { EntityName } from 'src/shared/error-messages';

// Mock TypeORM repository methods
const mockAttendanceRepository = {
  create: jest.fn(),
  save: jest.fn(),
  findAndCount: jest.fn(),
  findOne: jest.fn(),
  softDelete: jest.fn(),
};

// Mock EnrollmentsService methods
const mockEnrollmentsService = {
  getOneOrThrow: jest.fn(),
};

describe('AttendancesService', () => {
  let service: AttendancesService;
  let repository: Repository<Attendance>;
  let enrollmentsService: EnrollmentsService;

  const mockAttendanceId = 'mock-attendance-uuid';
  const mockEnrollmentId = 'mock-enrollment-uuid';
  const mockDate = new Date('2025-04-15T00:00:00.000Z');

  const mockAttendance: Attendance = {
    id: mockAttendanceId,
    enrollmentId: mockEnrollmentId,
    attendanceDate: mockDate,
    status: AttendanceStatus.Present,
    notes: 'Test note',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    enrollment: { id: mockEnrollmentId } as Enrollment, // Simplified mock
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AttendancesService,
        {
          provide: getRepositoryToken(Attendance),
          useValue: mockAttendanceRepository,
        },
        {
          provide: EnrollmentsService,
          useValue: mockEnrollmentsService,
        },
      ],
    }).compile();

    service = module.get<AttendancesService>(AttendancesService);
    repository = module.get<Repository<Attendance>>(
      getRepositoryToken(Attendance),
    );
    enrollmentsService = module.get<EnrollmentsService>(EnrollmentsService);

    // Reset mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // --- Test create method ---
  describe('create', () => {
    const createDto: CreateAttendanceDto = {
      enrollmentId: mockEnrollmentId,
      attendanceDate: '2025-04-15',
      status: AttendanceStatus.Present,
      notes: 'Test note',
    };

    it('should create and return an attendance record', async () => {
      mockEnrollmentsService.getOneOrThrow.mockResolvedValueOnce({
        id: mockEnrollmentId,
      }); // Mock enrollment exists
      mockAttendanceRepository.create.mockReturnValue(mockAttendance); // Mock create step
      mockAttendanceRepository.save.mockResolvedValue(mockAttendance); // Mock save step

      const result = await service.create(createDto);

      expect(enrollmentsService.getOneOrThrow).toHaveBeenCalledWith({
        where: { id: createDto.enrollmentId },
      });
      expect(repository.create).toHaveBeenCalledWith({
        ...createDto,
        attendanceDate: mockDate, // Expect date object
      });
      expect(repository.save).toHaveBeenCalledWith(mockAttendance);
      expect(result).toEqual(mockAttendance);
    });

    it('should throw NotFoundException if enrollment does not exist', async () => {
      mockEnrollmentsService.getOneOrThrow.mockRejectedValueOnce(
        new NotFoundException(),
      );

      await expect(service.create(createDto)).rejects.toThrow(
        NotFoundException,
      );
      expect(repository.create).not.toHaveBeenCalled();
      expect(repository.save).not.toHaveBeenCalled();
    });
  });

  // --- Test findAll method ---
  describe('findAll', () => {
    const getDto: GetAttendancesDto = { page: 1, pageSize: 10 };

    it('should return a list of attendances and count', async () => {
      const expectedResult = { results: [mockAttendance], count: 1 };
      mockAttendanceRepository.findAndCount.mockResolvedValue([
        [mockAttendance],
        1,
      ]);

      const result = await service.findAll(getDto);

      expect(repository.findAndCount).toHaveBeenCalledWith({
        where: {},
        relations: { enrollment: false }, // Default includeEnrollment is false
        skip: 0,
        take: 10,
        order: { attendanceDate: 'DESC' },
      });
      expect(result).toEqual(expectedResult);
    });

    it('should apply filters correctly (enrollmentId, status, date)', async () => {
      const getDtoFiltered: GetAttendancesDto = {
        ...getDto,
        enrollmentId: mockEnrollmentId,
        status: AttendanceStatus.Absent,
        attendanceDate: '2025-04-15',
        includeEnrollment: true,
      };
      const expectedWhere = {
        enrollmentId: mockEnrollmentId,
        status: AttendanceStatus.Absent,
        attendanceDate: mockDate,
      };
      mockAttendanceRepository.findAndCount.mockResolvedValue([[], 0]);

      await service.findAll(getDtoFiltered);

      expect(repository.findAndCount).toHaveBeenCalledWith({
        where: expectedWhere,
        relations: { enrollment: true },
        skip: 0,
        take: 10,
        order: { attendanceDate: 'DESC' },
      });
    });

    it('should apply date range filters correctly (startDate, endDate)', async () => {
      const startDateStr = '2025-04-01';
      const endDateStr = '2025-04-30';
      const startDate = new Date(startDateStr + 'T00:00:00.000Z');
      const endDate = new Date(endDateStr + 'T00:00:00.000Z');
      const getDtoRange: GetAttendancesDto = {
        ...getDto,
        startDate: startDateStr,
        endDate: endDateStr,
      };
      const expectedWhere = {
        attendanceDate: Between(startDate, endDate),
      };
      mockAttendanceRepository.findAndCount.mockResolvedValue([[], 0]);

      await service.findAll(getDtoRange);

      expect(repository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expectedWhere,
        }),
      );
    });

    it('should apply date range filters correctly (startDate only)', async () => {
      const startDateStr = '2025-04-10';
      const startDate = new Date(startDateStr + 'T00:00:00.000Z');
      const getDtoStart: GetAttendancesDto = {
        ...getDto,
        startDate: startDateStr,
      };
      const expectedWhere = {
        attendanceDate: MoreThanOrEqual(startDate),
      };
      mockAttendanceRepository.findAndCount.mockResolvedValue([[], 0]);

      await service.findAll(getDtoStart);

      expect(repository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expectedWhere,
        }),
      );
    });

    it('should apply date range filters correctly (endDate only)', async () => {
      const endDateStr = '2025-04-20';
      const endDate = new Date(endDateStr + 'T00:00:00.000Z');
      const getDtoEnd: GetAttendancesDto = {
        ...getDto,
        endDate: endDateStr,
      };
      const expectedWhere = {
        attendanceDate: LessThanOrEqual(endDate),
      };
      mockAttendanceRepository.findAndCount.mockResolvedValue([[], 0]);

      await service.findAll(getDtoEnd);

      expect(repository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expectedWhere,
        }),
      );
    });
  });

  // --- Test findOne method ---
  describe('findOne', () => {
    it('should return a single attendance record', async () => {
      // Mock the internal getOneOrThrow which uses findOne
      jest.spyOn(service, 'getOneOrThrow').mockResolvedValue(mockAttendance);

      const result = await service.findOne(mockAttendanceId);

      expect(service.getOneOrThrow).toHaveBeenCalledWith({
        where: { id: mockAttendanceId },
      });
      expect(result).toEqual(mockAttendance);
    });

    it('should throw NotFoundException if attendance not found', async () => {
      jest
        .spyOn(service, 'getOneOrThrow')
        .mockRejectedValue(
          new NotFoundException(
            `Attendance with id ${mockAttendanceId} not found`,
          ),
        );

      await expect(service.findOne(mockAttendanceId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // --- Test update method ---
  describe('update', () => {
    const updateDto: UpdateAttendanceDto = {
      status: AttendanceStatus.Late,
      notes: 'Updated note',
      attendanceDate: '2025-04-16',
    };
    const updatedDate = new Date('2025-04-16T00:00:00.000Z');

    it('should update and return the attendance record', async () => {
      const updatedAttendance = {
        ...mockAttendance,
        ...updateDto,
        attendanceDate: updatedDate,
      };
      // Mock findOne to return the existing record
      jest.spyOn(service, 'findOne').mockResolvedValue(mockAttendance);
      mockAttendanceRepository.save.mockResolvedValue(updatedAttendance); // Mock save returns updated

      const result = await service.update(mockAttendanceId, updateDto);

      expect(service.findOne).toHaveBeenCalledWith(mockAttendanceId);
      expect(repository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          // Check if Object.assign worked
          id: mockAttendanceId,
          status: updateDto.status,
          notes: updateDto.notes,
          attendanceDate: updatedDate,
        }),
      );
      expect(result).toEqual(updatedAttendance);
      expect(enrollmentsService.getOneOrThrow).not.toHaveBeenCalled(); // Enrollment ID not changed
    });

    it('should validate new enrollmentId if provided', async () => {
      const newEnrollmentId = 'new-enrollment-uuid';
      const updateDtoWithEnrollment: UpdateAttendanceDto = {
        ...updateDto,
        enrollmentId: newEnrollmentId,
      };
      const updatedAttendance = {
        ...mockAttendance,
        ...updateDtoWithEnrollment,
        attendanceDate: updatedDate,
      };

      jest.spyOn(service, 'findOne').mockResolvedValue(mockAttendance);
      mockEnrollmentsService.getOneOrThrow.mockResolvedValueOnce({
        id: newEnrollmentId,
      }); // Mock new enrollment exists
      mockAttendanceRepository.save.mockResolvedValue(updatedAttendance);

      await service.update(mockAttendanceId, updateDtoWithEnrollment);

      expect(service.findOne).toHaveBeenCalledWith(mockAttendanceId);
      expect(enrollmentsService.getOneOrThrow).toHaveBeenCalledWith({
        where: { id: newEnrollmentId },
      });
      expect(repository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          enrollmentId: newEnrollmentId,
        }),
      );
    });

    it('should throw NotFoundException if attendance to update is not found', async () => {
      jest.spyOn(service, 'findOne').mockRejectedValue(new NotFoundException());

      await expect(service.update(mockAttendanceId, updateDto)).rejects.toThrow(
        NotFoundException,
      );
      expect(repository.save).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if new enrollmentId does not exist', async () => {
      const newEnrollmentId = 'new-enrollment-uuid';
      const updateDtoWithEnrollment: UpdateAttendanceDto = {
        enrollmentId: newEnrollmentId,
      };

      jest.spyOn(service, 'findOne').mockResolvedValue(mockAttendance);
      mockEnrollmentsService.getOneOrThrow.mockRejectedValueOnce(
        new NotFoundException(),
      ); // Mock new enrollment NOT exists

      await expect(
        service.update(mockAttendanceId, updateDtoWithEnrollment),
      ).rejects.toThrow(NotFoundException);
      expect(repository.save).not.toHaveBeenCalled();
    });
  });

  // --- Test remove method ---
  describe('remove', () => {
    it('should soft delete the attendance record', async () => {
      // Mock findOne to simulate finding the record
      jest.spyOn(service, 'findOne').mockResolvedValue(mockAttendance);
      mockAttendanceRepository.softDelete.mockResolvedValue({ affected: 1 }); // Mock successful delete

      await service.remove(mockAttendanceId);

      expect(service.findOne).toHaveBeenCalledWith(mockAttendanceId);
      expect(repository.softDelete).toHaveBeenCalledWith(mockAttendanceId);
    });

    it('should throw NotFoundException if attendance to delete is not found', async () => {
      jest.spyOn(service, 'findOne').mockRejectedValue(new NotFoundException());

      await expect(service.remove(mockAttendanceId)).rejects.toThrow(
        NotFoundException,
      );
      expect(repository.softDelete).not.toHaveBeenCalled();
    });
  });

  // --- Test BaseService getOneOrThrow integration ---
  // Although BaseService is tested elsewhere, we ensure it's used correctly here
  describe('getOneOrThrow (integration within findOne)', () => {
    it('should use repository.findOne for getOneOrThrow', async () => {
      mockAttendanceRepository.findOne.mockResolvedValue(mockAttendance);
      const result = await service.findOne(mockAttendanceId); // findOne calls getOneOrThrow internally

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: mockAttendanceId },
      });
      expect(result).toEqual(mockAttendance);
    });

    it('should throw NotFoundException via getOneOrThrow if repository.findOne returns null', async () => {
      mockAttendanceRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(mockAttendanceId)).rejects.toThrow(
        new NotFoundException(ERROR_MESSAGES.notFound(EntityName.Attendance)),
      );
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: mockAttendanceId },
      });
    });
  });
});
