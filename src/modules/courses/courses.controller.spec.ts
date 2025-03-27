import { Test, TestingModule } from '@nestjs/testing';
import { CoursesController } from './courses.controller';
import { CoursesService } from './courses.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { GetCoursesDto } from './dto/get-course.dto';

describe('CoursesController', () => {
  let controller: CoursesController;
  let service: CoursesService;

  const mockCourse = {
    id: '1',
    name: 'Test Course',
    description: 'Test Description',
    credits: 3,
    required: true,
    departmentId: 'dept1',
  };

  const mockCourses = [mockCourse, { ...mockCourse, id: '2' }];
  const mockCount = mockCourses.length;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CoursesController],
      providers: [
        {
          provide: CoursesService,
          useValue: {
            create: jest.fn().mockResolvedValue(mockCourse),
            getCourses: jest
              .fn()
              .mockResolvedValue({ results: mockCourses, count: mockCount }),
            getOneOrThrow: jest.fn().mockResolvedValue(mockCourse),
            update: jest
              .fn()
              .mockResolvedValue({ ...mockCourse, name: 'Updated Course' }),
            delete: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    controller = module.get<CoursesController>(CoursesController);
    service = module.get<CoursesService>(CoursesService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createCourse', () => {
    it('should create a course', async () => {
      const createCourseDto: CreateCourseDto = {
        name: 'New Course',
        description: 'New Description',
        credits: 3,
        required: true,
        departmentId: 'dept1',
      };

      const result = await controller.createCourse(createCourseDto);

      expect(service.create).toHaveBeenCalledWith(createCourseDto);
      expect(result).toEqual(mockCourse);
    });
  });

  describe('getCourse', () => {
    it('should return a list of courses', async () => {
      const getCoursesDto: GetCoursesDto = { page: 1, pageSize: 10 };

      const result = await controller.getCourse(getCoursesDto);

      expect(service.getCourses).toHaveBeenCalledWith(getCoursesDto);
      expect(result).toEqual({ results: mockCourses, count: mockCount });
    });
  });

  describe('getCourseById', () => {
    it('should return a course by ID', async () => {
      const result = await controller.getCourseById('1');

      expect(service.getOneOrThrow).toHaveBeenCalledWith({
        where: { id: '1' },
      });
      expect(result).toEqual(mockCourse);
    });
  });

  describe('updateCourse', () => {
    it('should update a course by ID', async () => {
      const updateCourseDto: UpdateCourseDto = {
        name: 'Updated Course',
        description: 'Updated Description',
        credits: 4,
        required: false,
        departmentId: 'dept2',
      };

      const result = await controller.updateCourse('1', updateCourseDto);

      expect(service.update).toHaveBeenCalledWith('1', updateCourseDto);
      expect(result).toEqual({ ...mockCourse, name: 'Updated Course' });
    });
  });

  describe('remove', () => {
    it('should delete a course by ID', async () => {
      const result = await controller.remove('1');

      expect(service.delete).toHaveBeenCalledWith('1');
      expect(result).toBeUndefined();
    });
  });
});
