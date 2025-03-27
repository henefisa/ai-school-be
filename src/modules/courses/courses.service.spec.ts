import { Test, TestingModule } from '@nestjs/testing';
import { CoursesService } from './courses.service';
import { Course } from 'src/typeorm/entities/course.entity';
import { Repository } from 'typeorm/repository/Repository';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ExistsException } from 'src/shared/exceptions/exists.exception';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { EntityName } from 'src/shared/error-messages';

describe('CoursesService', () => {
  let service: CoursesService;
  let repository: Repository<Course>;

  const mockCourse = {
    id: '1',
    name: 'Test Course',
    description: 'Test Description',
    credits: 3,
    required: true,
    departmentId: 'dept1',
  } as Course;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CoursesService,
        {
          provide: getRepositoryToken(Course),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
            delete: jest.fn(),
            findAndCount: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<CoursesService>(CoursesService);
    repository = module.get<Repository<Course>>(getRepositoryToken(Course));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a course if name is available', async () => {
      const createCourseDto: CreateCourseDto = {
        name: 'New Course',
        description: 'New Description',
        credits: 3,
        required: true,
        departmentId: 'dept1',
      };

      jest.spyOn(service, 'isNameAvailable').mockResolvedValue(true);
      jest.spyOn(repository, 'save').mockResolvedValue(mockCourse);

      const result = await service.create(createCourseDto);

      expect(service.isNameAvailable).toHaveBeenCalledWith(
        createCourseDto.name,
      );
      expect(repository.save).toHaveBeenCalledWith(createCourseDto);
      expect(result).toEqual(mockCourse);
    });

    it('should throw an error if course name is not available', async () => {
      const createCourseDto: CreateCourseDto = {
        name: 'Existing Course',
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
      expect(repository.save).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update a course if name is available', async () => {
      const updateCourseDto: UpdateCourseDto = {
        name: 'Updated Course',
        description: 'Updated Description',
        credits: 4,
        required: false,
        departmentId: 'dept2',
      };

      jest.spyOn(service, 'isNameAvailable').mockResolvedValue(true);
      jest.spyOn(service, 'getOneOrThrow').mockResolvedValue(mockCourse);
      jest
        .spyOn(repository, 'save')
        .mockResolvedValue({ ...mockCourse, ...updateCourseDto });

      const result = await service.update('1', updateCourseDto);

      expect(service.getOneOrThrow).toHaveBeenCalledWith({
        where: { id: '1' },
      });
      expect(service.isNameAvailable).toHaveBeenCalledWith(
        updateCourseDto.name,
        null,
        '1',
      );
      expect(repository.save).toHaveBeenCalledWith({
        ...mockCourse,
        ...updateCourseDto,
      });
      expect(result).toEqual({ ...mockCourse, ...updateCourseDto });
    });

    it('should throw an error if course name is not available', async () => {
      const updateCourseDto: UpdateCourseDto = {
        name: 'Existing Course',
        description: 'Updated Description',
        credits: 4,
        required: false,
        departmentId: 'dept2',
      };

      jest.spyOn(service, 'getOneOrThrow').mockResolvedValue(mockCourse);
      jest
        .spyOn(service, 'isNameAvailable')
        .mockRejectedValue(new ExistsException(EntityName.Course));

      await expect(service.update('1', updateCourseDto)).rejects.toThrow(
        ExistsException,
      );
      expect(repository.save).not.toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('should delete a course by id', async () => {
      const result = await service.delete('1');

      expect(repository.delete).toHaveBeenCalledWith({ id: '1' });
      expect(result).toBeUndefined();
    });
  });

  describe('getCourses', () => {
    it('should return a paginated list of courses', async () => {
      const getCoursesDto = { page: 1, pageSize: 10 };
      const mockCourses = [mockCourse, { ...mockCourse, id: '2' }];
      const mockCount = mockCourses.length;

      jest
        .spyOn(repository, 'findAndCount')
        .mockResolvedValue([mockCourses, mockCount]);

      const result = await service.getCourses(getCoursesDto);

      expect(repository.findAndCount).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
      });
      expect(result).toEqual({
        results: mockCourses,
        count: mockCount,
      });
    });
  });
});
