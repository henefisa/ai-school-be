import { Test, TestingModule } from '@nestjs/testing';
import { AttendancesController } from './attendances.controller';
import { AttendancesService } from './attendances.service';
import { CreateAttendanceDto } from './dto/create-attendance.dto';
import { UpdateAttendanceDto } from './dto/update-attendance.dto';
import { GetAttendancesDto } from './dto/get-attendances.dto';
import { Attendance } from 'src/typeorm/entities/attendance.entity';
import { Enrollment } from 'src/typeorm/entities/enrollment.entity'; // Import Enrollment
import { AttendanceStatus } from 'src/shared/constants';
import { NotFoundException } from '@nestjs/common';
import { JwtAuthGuard } from 'src/shared/guards/jwt-auth.guard';
import { RolesGuard } from 'src/shared/guards/roles.guard';

// Mock AttendancesService methods
const mockAttendancesService = {
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
};

describe('AttendancesController', () => {
  let controller: AttendancesController;
  let service: AttendancesService;

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
    enrollment: { id: mockEnrollmentId } as Enrollment, // Provide a minimal mock
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AttendancesController],
      providers: [
        {
          provide: AttendancesService,
          useValue: mockAttendancesService,
        },
      ],
    })
      // Mock guards for simplicity, assuming Auth decorator works
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<AttendancesController>(AttendancesController);
    service = module.get<AttendancesService>(AttendancesService);

    // Reset mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // --- Test create method ---
  describe('create', () => {
    const createDto: CreateAttendanceDto = {
      enrollmentId: mockEnrollmentId,
      attendanceDate: '2025-04-15',
      status: AttendanceStatus.Present,
      notes: 'Test note',
    };

    it('should call service.create and return the result', async () => {
      mockAttendancesService.create.mockResolvedValue(mockAttendance);

      const result = await controller.create(createDto);

      expect(service.create).toHaveBeenCalledWith(createDto);
      expect(result).toEqual(mockAttendance);
    });

    it('should propagate errors from service.create', async () => {
      const error = new NotFoundException('Enrollment not found');
      mockAttendancesService.create.mockRejectedValue(error);

      await expect(controller.create(createDto)).rejects.toThrow(
        NotFoundException,
      );
      expect(service.create).toHaveBeenCalledWith(createDto);
    });
  });

  // --- Test findAll method ---
  describe('findAll', () => {
    const getDto: GetAttendancesDto = { page: 1, pageSize: 10 };
    const expectedResult = { results: [mockAttendance], count: 1 };

    it('should call service.findAll and return the result', async () => {
      mockAttendancesService.findAll.mockResolvedValue(expectedResult);

      const result = await controller.findAll(getDto);

      expect(service.findAll).toHaveBeenCalledWith(getDto);
      expect(result).toEqual(expectedResult);
    });
  });

  // --- Test findOne method ---
  describe('findOne', () => {
    it('should call service.findOne and return the result', async () => {
      mockAttendancesService.findOne.mockResolvedValue(mockAttendance);

      const result = await controller.findOne(mockAttendanceId);

      expect(service.findOne).toHaveBeenCalledWith(mockAttendanceId);
      expect(result).toEqual(mockAttendance);
    });

    it('should throw NotFoundException if service.findOne throws', async () => {
      const error = new NotFoundException('Attendance not found');
      mockAttendancesService.findOne.mockRejectedValue(error);

      await expect(controller.findOne(mockAttendanceId)).rejects.toThrow(
        NotFoundException,
      );
      expect(service.findOne).toHaveBeenCalledWith(mockAttendanceId);
    });
  });

  // --- Test update method ---
  describe('update', () => {
    const updateDto: UpdateAttendanceDto = {
      status: AttendanceStatus.Late,
      notes: 'Updated note',
    };
    const updatedAttendance = { ...mockAttendance, ...updateDto };

    it('should call service.update and return the result', async () => {
      mockAttendancesService.update.mockResolvedValue(updatedAttendance);

      const result = await controller.update(mockAttendanceId, updateDto);

      expect(service.update).toHaveBeenCalledWith(mockAttendanceId, updateDto);
      expect(result).toEqual(updatedAttendance);
    });

    it('should throw NotFoundException if service.update throws', async () => {
      const error = new NotFoundException('Attendance not found');
      mockAttendancesService.update.mockRejectedValue(error);

      await expect(
        controller.update(mockAttendanceId, updateDto),
      ).rejects.toThrow(NotFoundException);
      expect(service.update).toHaveBeenCalledWith(mockAttendanceId, updateDto);
    });
  });

  // --- Test remove method ---
  describe('remove', () => {
    it('should call service.remove and return void', async () => {
      mockAttendancesService.remove.mockResolvedValue(undefined); // remove returns Promise<void>

      await controller.remove(mockAttendanceId);

      expect(service.remove).toHaveBeenCalledWith(mockAttendanceId);
    });

    it('should throw NotFoundException if service.remove throws', async () => {
      const error = new NotFoundException('Attendance not found');
      mockAttendancesService.remove.mockRejectedValue(error);

      await expect(controller.remove(mockAttendanceId)).rejects.toThrow(
        NotFoundException,
      );
      expect(service.remove).toHaveBeenCalledWith(mockAttendanceId);
    });
  });
});
