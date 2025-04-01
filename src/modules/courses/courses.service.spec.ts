import { Test, TestingModule } from '@nestjs/testing';
import { CoursesService } from './courses.service';
import { Course } from 'src/typeorm/entities/course.entity';
import { Repository, UpdateResult } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ExistsException } from 'src/shared/exceptions/exists.exception';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { EntityName } from 'src/shared/error-messages';
import { ClassRoom } from 'src/typeorm/entities/class.entity';
import { DepartmentsService } from 'src/modules/departments/departments.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Department } from 'src/typeorm/entities/department.entity';

describe('CoursesService', () => {
  let service: CoursesService;
  let courseRepository: Repository<Course>;
  let classRoomRepository: Repository<ClassRoom>;
  let departmentsService: DepartmentsService;

  const mockCourse = {
    id: '1',
    name: 'Test Course',
    code: 'TEST101',
    description: 'Test Description',
    credits: 3,
    required: true,
    departmentId: 'dept1',
  } as Course;

  const mockDepartment = {
    id: 'dept1',
    name: 'Computer Science',
    code: 'CS',
    headId: null,
    description: '',
    location: '',
    email: '',
    phoneNumber: '',
    createdAt: new Date(),
    updatedAt: new Date(),
  } as Department;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CoursesService,
        {
          provide: getRepositoryToken(Course),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
            softDelete: jest.fn(),
            findAndCount: jest.fn(),
            manager: {
              transaction: jest.fn((callback) =>
                callback({
                  findOne: jest.fn(),
                  create: jest.fn().mockReturnValue(mockCourse),
                  save: jest.fn().mockResolvedValue(mockCourse),
                }),
              ),
            },
          },
        },
        {
          provide: getRepositoryToken(ClassRoom),
          useValue: {
            find: jest.fn(),
          },
        },
        {
          provide: DepartmentsService,
          useValue: {
            verifyDepartmentExists: jest.fn(),
            getDepartmentById: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<CoursesService>(CoursesService);
    courseRepository = module.get<Repository<Course>>(
      getRepositoryToken(Course),
    );
    classRoomRepository = module.get<Repository<ClassRoom>>(
      getRepositoryToken(ClassRoom),
    );
    departmentsService = module.get<DepartmentsService>(DepartmentsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a course if name and code are available', async () => {
      const createCourseDto: CreateCourseDto = {
        name: 'New Course',
        code: 'NEW101',
        description: 'New Description',
        credits: 3,
        required: true,
        departmentId: 'dept1',
      };

      const mockEntityManager = {
        findOne: jest.fn(),
        create: jest.fn().mockReturnValue(mockCourse),
        save: jest.fn().mockResolvedValue(mockCourse),
      };

      (
        courseRepository.manager.transaction as jest.Mock
      ).mockImplementationOnce((cb) => cb(mockEntityManager));

      jest.spyOn(service, 'isNameAvailable').mockResolvedValue(true);
      jest.spyOn(service, 'isCodeAvailable').mockResolvedValue(true);
      jest.spyOn(service, 'getOneOrThrow').mockResolvedValue({
        ...mockCourse,
        department: mockDepartment,
      } as Course);

      const result = await service.create(createCourseDto);

      expect(service.isNameAvailable).toHaveBeenCalledWith(
        createCourseDto.name,
        mockEntityManager,
      );
      expect(service.isCodeAvailable).toHaveBeenCalledWith(
        createCourseDto.code,
        mockEntityManager,
      );
      expect(mockEntityManager.create).toHaveBeenCalled();
      expect(mockEntityManager.save).toHaveBeenCalled();
      expect(result).toEqual({
        ...mockCourse,
        department: mockDepartment,
      });
    });

    it('should throw an error if course name is not available', async () => {
      const createCourseDto: CreateCourseDto = {
        name: 'Existing Course',
        code: 'EXIST101',
        description: 'Existing Description',
        credits: 3,
        required: true,
        departmentId: 'dept1',
      };

      jest
        .spyOn(service, 'isNameAvailable')
        .mockRejectedValue(new ExistsException(EntityName.Course));

      await expect(service.create(createCourseDto)).rejects.toThrow(
        ExistsException,
      );
    });

    it('should throw an error if department does not exist', async () => {
      const createCourseDto: CreateCourseDto = {
        name: 'New Course',
        code: 'NEW101',
        description: 'New Description',
        credits: 3,
        required: true,
        departmentId: 'invalid-dept',
      };

      const mockEntityManager = {
        findOne: jest.fn(),
        create: jest.fn(),
        save: jest.fn(),
      };

      (
        courseRepository.manager.transaction as jest.Mock
      ).mockImplementationOnce((cb) => cb(mockEntityManager));

      jest.spyOn(service, 'isNameAvailable').mockResolvedValue(true);
      jest.spyOn(service, 'isCodeAvailable').mockResolvedValue(true);
      jest
        .spyOn(departmentsService, 'verifyDepartmentExists')
        .mockRejectedValue(new NotFoundException('Department not found'));

      await expect(service.create(createCourseDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update a course if name and code are available', async () => {
      const updateCourseDto: UpdateCourseDto = {
        name: 'Updated Course',
        code: 'UPD101',
        description: 'Updated Description',
        credits: 4,
        required: false,
        departmentId: 'dept2',
      };

      jest.spyOn(service, 'isNameAvailable').mockResolvedValue(true);
      jest.spyOn(service, 'isCodeAvailable').mockResolvedValue(true);
      jest.spyOn(service, 'getOneOrThrow').mockResolvedValue(mockCourse);
      jest.spyOn(courseRepository, 'save').mockResolvedValue({
        ...mockCourse,
        ...updateCourseDto,
      } as Course);

      const result = await service.update('1', updateCourseDto);

      expect(service.getOneOrThrow).toHaveBeenCalledWith({
        where: { id: '1' },
      });
      expect(courseRepository.save).toHaveBeenCalled();
      expect(result).toEqual({ ...mockCourse, ...updateCourseDto });
    });

    it('should throw an error if course name is not available', async () => {
      const updateCourseDto: UpdateCourseDto = {
        name: 'Existing Course',
        code: 'EXIST101',
      };

      jest.spyOn(service, 'getOneOrThrow').mockResolvedValue(mockCourse);
      jest
        .spyOn(service, 'isNameAvailable')
        .mockRejectedValue(new ExistsException(EntityName.Course));

      await expect(service.update('1', updateCourseDto)).rejects.toThrow(
        ExistsException,
      );
    });
  });

  describe('delete', () => {
    it('should delete a course by id', async () => {
      jest.spyOn(classRoomRepository, 'find').mockResolvedValue([]);
      jest.spyOn(courseRepository, 'softDelete').mockResolvedValue({
        affected: 1,
        raw: {},
      } as UpdateResult);

      const result = await service.delete('1');

      expect(classRoomRepository.find).toHaveBeenCalledWith({
        where: { courseId: '1' },
      });
      expect(courseRepository.softDelete).toHaveBeenCalledWith({ id: '1' });
      expect(result).toEqual({ message: 'Course deleted successfully' });
    });

    it('should throw an error if course is associated with classes', async () => {
      jest
        .spyOn(classRoomRepository, 'find')
        .mockResolvedValue([{} as ClassRoom]);

      await expect(service.delete('1')).rejects.toThrow(BadRequestException);
      expect(courseRepository.softDelete).not.toHaveBeenCalled();
    });
  });

  describe('getCourses', () => {
    it('should return a paginated list of courses', async () => {
      const getCoursesDto = { page: 1, pageSize: 10 };
      const mockCourses = [mockCourse, { ...mockCourse, id: '2' }];
      const mockCount = mockCourses.length;

      jest
        .spyOn(courseRepository, 'findAndCount')
        .mockResolvedValue([mockCourses, mockCount]);

      const result = await service.getCourses(getCoursesDto);

      expect(courseRepository.findAndCount).toHaveBeenCalled();
      expect(result).toEqual({
        results: mockCourses,
        count: mockCount,
        page: 1,
        pageSize: 10,
        totalPages: 1,
      });
    });
  });

  describe('getCourseDetails', () => {
    it('should return detailed course information', async () => {
      const mockCourseWithRelations = {
        ...mockCourse,
        department: mockDepartment,
        classes: [
          {
            id: 'class1',
            assignments: [
              {
                id: 'assignment1',
                teacher: {
                  id: 'teacher1',
                  firstName: 'John',
                  lastName: 'Doe',
                  email: 'john@example.com',
                },
              },
            ],
            enrollments: [{ id: 'enrollment1', student: { id: 'student1' } }],
          },
        ],
      } as unknown as Course;

      jest
        .spyOn(courseRepository, 'findOne')
        .mockResolvedValue(mockCourseWithRelations);

      const result = await service.getCourseDetails('1');

      expect(courseRepository.findOne).toHaveBeenCalledWith({
        where: { id: '1' },
        relations: [
          'department',
          'classes',
          'classes.assignments',
          'classes.assignments.teacher',
          'classes.enrollments',
          'classes.enrollments.student',
        ],
      });

      expect(result).toHaveProperty('teachersCount', 1);
      expect(result).toHaveProperty('enrolledStudentsCount', 1);
    });

    it('should throw an error if course is not found', async () => {
      jest.spyOn(courseRepository, 'findOne').mockResolvedValue(null);

      await expect(service.getCourseDetails('1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('getDepartmentCourses', () => {
    it('should return courses for a specific department', async () => {
      const departmentId = 'dept1';
      const getCoursesDto = { page: 1, pageSize: 10 };
      const mockCourses = [mockCourse, { ...mockCourse, id: '2' }];
      const mockCount = mockCourses.length;

      jest
        .spyOn(departmentsService, 'getDepartmentById')
        .mockResolvedValue(mockDepartment);
      jest
        .spyOn(courseRepository, 'findAndCount')
        .mockResolvedValue([mockCourses, mockCount]);

      const result = await service.getDepartmentCourses(
        departmentId,
        getCoursesDto,
      );

      expect(departmentsService.getDepartmentById).toHaveBeenCalledWith(
        departmentId,
      );
      expect(courseRepository.findAndCount).toHaveBeenCalled();
      expect(result).toEqual({
        department: {
          id: mockDepartment.id,
          name: mockDepartment.name,
          code: mockDepartment.code,
        },
        results: mockCourses,
        count: mockCount,
        page: 1,
        pageSize: 10,
        totalPages: 1,
      });
    });

    it('should throw an error if department does not exist', async () => {
      const departmentId = 'invalid-dept';
      const getCoursesDto = { page: 1, pageSize: 10 };

      jest
        .spyOn(departmentsService, 'getDepartmentById')
        .mockRejectedValue(new NotFoundException('Department not found'));

      await expect(
        service.getDepartmentCourses(departmentId, getCoursesDto),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
