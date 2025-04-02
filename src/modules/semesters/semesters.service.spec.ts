import { Test, TestingModule } from '@nestjs/testing';
import { SemestersService } from './semesters.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Semester } from 'src/typeorm/entities/semester.entity';
import { Course } from 'src/typeorm/entities/course.entity';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { CreateSemesterDto } from './dto/create-semester.dto';
import { UpdateSemesterDto } from './dto/update-semester.dto';
import { GetSemestersDto } from './dto/get-semester.dto';
import { SemesterStatus } from 'src/shared/constants';
import { GenerateAcademicCalendarDto } from './dto/generate-academic-calendar.dto';

type MockRepository<T = any> = Partial<Record<keyof Repository<T>, jest.Mock>>;

const createMockRepository = <T = any>(): MockRepository<T> => ({
  find: jest.fn(),
  findOne: jest.fn(),
  findAndCount: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  findBy: jest.fn(),
});

describe('SemestersService', () => {
  let service: SemestersService;
  let semesterRepository: MockRepository<Semester>;
  let courseRepository: MockRepository<Course>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SemestersService,
        {
          provide: getRepositoryToken(Semester),
          useValue: createMockRepository(),
        },
        {
          provide: getRepositoryToken(Course),
          useValue: createMockRepository(),
        },
      ],
    }).compile();

    service = module.get<SemestersService>(SemestersService);
    semesterRepository = module.get<MockRepository<Semester>>(
      getRepositoryToken(Semester),
    );
    courseRepository = module.get<MockRepository<Course>>(
      getRepositoryToken(Course),
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getSemesters', () => {
    it('should return paginated semesters', async () => {
      const mockSemesters = [
        {
          id: '1',
          name: 'Fall 2023',
          startDate: new Date('2023-09-01'),
          endDate: new Date('2023-12-31'),
          status: SemesterStatus.Active,
        },
      ];

      const dto: GetSemestersDto = {
        page: 1,
        pageSize: 10,
      };

      semesterRepository.findAndCount.mockResolvedValue([mockSemesters, 1]);

      const result = await service.getSemesters(dto);

      expect(result).toEqual({
        results: mockSemesters,
        count: 1,
        page: 1,
        pageSize: 10,
        totalPages: 1,
      });
      expect(semesterRepository.findAndCount).toHaveBeenCalled();
    });
  });

  describe('isNameAvailable', () => {
    it('should return true if semester name is available', async () => {
      const name = 'Unique Semester';

      // Mock implementation for the getOne method
      jest.spyOn(service, 'getOne').mockResolvedValue(null);

      const result = await service.isNameAvailable(name);

      expect(result).toBe(true);
    });

    it('should throw an exception if semester name already exists', async () => {
      const name = 'Existing Semester';

      // Mock implementation for the getOne method
      jest.spyOn(service, 'getOne').mockResolvedValue({
        id: '1',
        name: 'Existing Semester',
      } as Semester);

      await expect(service.isNameAvailable(name)).rejects.toThrow();
    });
  });

  describe('checkDateOverlap', () => {
    it('should return true if no overlapping semesters', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-05-31');

      semesterRepository.findOne.mockResolvedValue(null);

      const result = await service.checkDateOverlap(startDate, endDate);

      expect(result).toBe(true);
      expect(semesterRepository.findOne).toHaveBeenCalled();
    });

    it('should throw an exception if dates overlap with existing semester', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-05-31');

      semesterRepository.findOne.mockResolvedValue({
        id: '1',
        name: 'Overlapping Semester',
      } as Semester);

      await expect(
        service.checkDateOverlap(startDate, endDate),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw if start date is after end date', async () => {
      const startDate = new Date('2024-06-01');
      const endDate = new Date('2024-05-31');

      await expect(
        service.checkDateOverlap(startDate, endDate),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('create', () => {
    it('should create a new semester', async () => {
      const dto: CreateSemesterDto = {
        name: 'Fall 2023',
        startDate: new Date('2023-09-01'),
        endDate: new Date('2023-12-31'),
      };

      const mockSemester = {
        id: '1',
        ...dto,
        status: SemesterStatus.Active,
        currentSemester: false,
        academicYear: '2023-2024',
      };

      // Mock implementations
      jest.spyOn(service, 'isNameAvailable').mockResolvedValue(true);
      jest.spyOn(service, 'checkDateOverlap').mockResolvedValue(true);
      semesterRepository.save.mockResolvedValue(mockSemester);

      const result = await service.create(dto);

      expect(result).toEqual(mockSemester);
      expect(service.isNameAvailable).toHaveBeenCalledWith(dto.name);
      expect(service.checkDateOverlap).toHaveBeenCalledWith(
        dto.startDate,
        dto.endDate,
      );
      expect(semesterRepository.save).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update a semester', async () => {
      const id = '1';
      const dto: UpdateSemesterDto = {
        name: 'Updated Fall 2023',
      };

      const existingSemester = {
        id,
        name: 'Fall 2023',
        startDate: new Date('2023-09-01'),
        endDate: new Date('2023-12-31'),
        status: SemesterStatus.Active,
        currentSemester: false,
        academicYear: '2023-2024',
      };

      const updatedSemester = {
        ...existingSemester,
        name: dto.name,
      };

      // Mock implementations
      jest
        .spyOn(service, 'getOneOrThrow')
        .mockResolvedValue(existingSemester as Semester);
      jest.spyOn(service, 'isNameAvailable').mockResolvedValue(true);
      semesterRepository.save.mockResolvedValue(updatedSemester);

      const result = await service.update(id, dto);

      expect(result).toEqual(updatedSemester);
      expect(service.getOneOrThrow).toHaveBeenCalledWith({ where: { id } });
      expect(service.isNameAvailable).toHaveBeenCalledWith(
        dto.name,
        undefined,
        id,
      );
      expect(semesterRepository.save).toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('should delete a semester', async () => {
      const id = '1';
      const mockSemester = {
        id,
        name: 'Fall 2023',
        classes: [],
      };

      // Mock implementations
      jest
        .spyOn(service, 'getOneOrThrow')
        .mockResolvedValue(mockSemester as Semester);
      semesterRepository.delete.mockResolvedValue(undefined);

      const result = await service.delete(id);

      expect(result).toEqual({
        success: true,
        message: `Semester "${mockSemester.name}" deleted successfully`,
      });
      expect(service.getOneOrThrow).toHaveBeenCalledWith({
        where: { id },
        relations: ['classes'],
      });
      expect(semesterRepository.delete).toHaveBeenCalledWith({ id });
    });

    it('should throw an exception if semester has classes', async () => {
      const id = '1';
      const mockSemester = {
        id,
        name: 'Fall 2023',
        classes: [{ id: 'class1' }],
      };

      // Mock implementation
      jest
        .spyOn(service, 'getOneOrThrow')
        .mockResolvedValue(mockSemester as Semester);

      await expect(service.delete(id)).rejects.toThrow(BadRequestException);
    });
  });

  describe('getCurrentSemester', () => {
    it('should return the current semester by currentSemester flag', async () => {
      const mockSemester = {
        id: '1',
        name: 'Fall 2023',
        currentSemester: true,
      };

      semesterRepository.findOne.mockResolvedValue(mockSemester as Semester);

      const result = await service.getCurrentSemester();

      expect(result).toEqual(mockSemester);
      expect(semesterRepository.findOne).toHaveBeenCalledWith({
        where: { currentSemester: true },
      });
    });

    it('should return the active semester by date range if no current semester flag', async () => {
      // First findOne returns null (no current semester flag)
      semesterRepository.findOne.mockResolvedValueOnce(null);

      const mockActiveSemester = {
        id: '1',
        name: 'Fall 2023',
        status: SemesterStatus.Active,
      };

      // Second findOne returns an active semester
      semesterRepository.findOne.mockResolvedValueOnce(
        mockActiveSemester as Semester,
      );

      const result = await service.getCurrentSemester();

      expect(result).toEqual(mockActiveSemester);
      expect(semesterRepository.findOne).toHaveBeenCalledTimes(2);
    });

    it('should return the upcoming semester if no current or active semester', async () => {
      // First and second findOne return null
      semesterRepository.findOne.mockResolvedValueOnce(null);
      semesterRepository.findOne.mockResolvedValueOnce(null);

      const mockUpcomingSemester = {
        id: '1',
        name: 'Spring 2024',
        status: SemesterStatus.Upcoming,
      };

      // Third findOne returns an upcoming semester
      semesterRepository.findOne.mockResolvedValueOnce(
        mockUpcomingSemester as Semester,
      );

      const result = await service.getCurrentSemester();

      expect(result).toEqual(mockUpcomingSemester);
      expect(semesterRepository.findOne).toHaveBeenCalledTimes(3);
    });

    it('should throw NotFoundException if no current, active, or upcoming semester', async () => {
      // All findOne calls return null
      semesterRepository.findOne.mockResolvedValue(null);

      await expect(service.getCurrentSemester()).rejects.toThrow(
        NotFoundException,
      );
      expect(semesterRepository.findOne).toHaveBeenCalledTimes(3);
    });
  });

  describe('generateAcademicCalendar', () => {
    it('should generate semesters for the academic calendar', async () => {
      const dto: GenerateAcademicCalendarDto = {
        startingAcademicYear: '2023-2024',
        numberOfYears: 1,
        firstSemesterStartDate: new Date('2023-09-01'),
        firstSemesterEndDate: new Date('2023-12-31'),
        secondSemesterStartDate: new Date('2024-01-15'),
        secondSemesterEndDate: new Date('2024-05-31'),
      };

      const mockFallSemester = {
        id: '1',
        name: 'Fall 2023',
        startDate: new Date('2023-09-01'),
        endDate: new Date('2023-12-31'),
        academicYear: '2023-2024',
      };

      const mockSpringSemester = {
        id: '2',
        name: 'Spring 2024',
        startDate: new Date('2024-01-15'),
        endDate: new Date('2024-05-31'),
        academicYear: '2023-2024',
      };

      // Mock create method
      jest
        .spyOn(service, 'create')
        .mockResolvedValueOnce(mockFallSemester as Semester)
        .mockResolvedValueOnce(mockSpringSemester as Semester);

      const result = await service.generateAcademicCalendar(dto);

      expect(result).toEqual([mockFallSemester, mockSpringSemester]);
      expect(service.create).toHaveBeenCalledTimes(2);
    });

    it('should include summer semester if provided', async () => {
      const dto: GenerateAcademicCalendarDto = {
        startingAcademicYear: '2023-2024',
        numberOfYears: 1,
        firstSemesterStartDate: new Date('2023-09-01'),
        firstSemesterEndDate: new Date('2023-12-31'),
        secondSemesterStartDate: new Date('2024-01-15'),
        secondSemesterEndDate: new Date('2024-05-31'),
        summerSemester: {
          startDate: new Date('2024-06-15'),
          endDate: new Date('2024-08-15'),
        },
      };

      const mockFallSemester = {
        id: '1',
        name: 'Fall 2023',
      };

      const mockSpringSemester = {
        id: '2',
        name: 'Spring 2024',
      };

      const mockSummerSemester = {
        id: '3',
        name: 'Summer 2024',
      };

      // Mock create method
      jest
        .spyOn(service, 'create')
        .mockResolvedValueOnce(mockFallSemester as Semester)
        .mockResolvedValueOnce(mockSpringSemester as Semester)
        .mockResolvedValueOnce(mockSummerSemester as Semester);

      const result = await service.generateAcademicCalendar(dto);

      expect(result).toEqual([
        mockFallSemester,
        mockSpringSemester,
        mockSummerSemester,
      ]);
      expect(service.create).toHaveBeenCalledTimes(3);
    });

    it('should throw if academic year format is invalid', async () => {
      const dto: GenerateAcademicCalendarDto = {
        startingAcademicYear: 'invalid-format',
        firstSemesterStartDate: new Date('2023-09-01'),
        firstSemesterEndDate: new Date('2023-12-31'),
        secondSemesterStartDate: new Date('2024-01-15'),
        secondSemesterEndDate: new Date('2024-05-31'),
      };

      await expect(service.generateAcademicCalendar(dto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('assignCourses', () => {
    it('should assign courses to a semester', async () => {
      const semesterId = '1';
      const courseIds = ['course1', 'course2'];

      const mockSemester = {
        id: semesterId,
        name: 'Fall 2023',
        courses: [],
      };

      const mockCourses = [
        { id: 'course1', name: 'Course 1' },
        { id: 'course2', name: 'Course 2' },
      ];

      // Mock implementations
      jest
        .spyOn(service, 'getOneOrThrow')
        .mockResolvedValue(mockSemester as Semester);
      courseRepository.findBy.mockResolvedValue(mockCourses as Course[]);
      semesterRepository.save.mockResolvedValue({
        ...mockSemester,
        courses: mockCourses,
      } as Semester);

      const result = await service.assignCourses(semesterId, courseIds);

      expect(result).toEqual({
        ...mockSemester,
        courses: mockCourses,
      });
      expect(service.getOneOrThrow).toHaveBeenCalledWith({
        where: { id: semesterId },
        relations: ['courses'],
      });
      expect(semesterRepository.save).toHaveBeenCalled();
    });

    it('should throw if not all courses are found', async () => {
      const semesterId = '1';
      const courseIds = ['course1', 'course2'];

      const mockSemester = {
        id: semesterId,
        name: 'Fall 2023',
        courses: [],
      };

      // Only one course found when two were requested
      const mockCourses = [{ id: 'course1', name: 'Course 1' }];

      // Mock implementations
      jest
        .spyOn(service, 'getOneOrThrow')
        .mockResolvedValue(mockSemester as Semester);
      courseRepository.findBy.mockResolvedValue(mockCourses as Course[]);

      await expect(
        service.assignCourses(semesterId, courseIds),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
