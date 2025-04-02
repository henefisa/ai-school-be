import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  EntityManager,
  LessThan,
  MoreThan,
  Not,
  Repository,
  Between,
  FindOptionsWhere,
  ILike,
  In,
} from 'typeorm';
import { Semester } from 'src/typeorm/entities/semester.entity';
import { BaseService } from 'src/shared/base.service';
import { EntityName } from 'src/shared/error-messages';
import { GetSemestersDto } from './dto/get-semester.dto';
import { CreateSemesterDto } from './dto/create-semester.dto';
import { ExistsException } from 'src/shared/exceptions/exists.exception';
import { UpdateSemesterDto } from './dto/update-semester.dto';
import { SemesterStatus } from 'src/shared/constants';
import { GenerateAcademicCalendarDto } from './dto/generate-academic-calendar.dto';
import { Course } from 'src/typeorm/entities/course.entity';

@Injectable()
export class SemestersService extends BaseService<Semester> {
  constructor(
    @InjectRepository(Semester)
    private readonly semesterRepository: Repository<Semester>,
    @InjectRepository(Course)
    private readonly courseRepository: Repository<Course>,
  ) {
    super(EntityName.Semester, semesterRepository);
  }

  async getSemesters(dto: GetSemestersDto) {
    const where: FindOptionsWhere<Semester> = {};

    // Apply filters if provided
    if (dto.name) {
      where.name = ILike(`%${dto.name}%`);
    }

    if (dto.academicYear) {
      where.academicYear = dto.academicYear;
    }

    if (dto.status) {
      where.status = dto.status;
    }

    if (dto.currentSemester !== undefined) {
      where.currentSemester = dto.currentSemester;
    }

    // Date range filters
    if (dto.startDateFrom) {
      where.startDate = MoreThan(dto.startDateFrom);
    }

    if (dto.startDateTo) {
      where.startDate = LessThan(dto.startDateTo);
    }

    if (dto.endDateFrom) {
      where.endDate = MoreThan(dto.endDateFrom);
    }

    if (dto.endDateTo) {
      where.endDate = LessThan(dto.endDateTo);
    }

    // Handle date ranges properly
    if (dto.startDateFrom && dto.startDateTo) {
      where.startDate = Between(dto.startDateFrom, dto.startDateTo);
    }

    if (dto.endDateFrom && dto.endDateTo) {
      where.endDate = Between(dto.endDateFrom, dto.endDateTo);
    }

    const [results, count] = await this.semesterRepository.findAndCount({
      where,
      skip: ((dto.page ?? 1) - 1) * (dto.pageSize ?? 10),
      take: dto.pageSize ?? 10,
      order: {
        [dto.sortBy || 'startDate']: dto.sortOrder || 'DESC',
      },
    });

    return {
      results,
      count,
      page: dto.page ?? 1,
      pageSize: dto.pageSize ?? 10,
      totalPages: Math.ceil(count / (dto.pageSize ?? 10)),
    };
  }

  async isNameAvailable(
    name: string,
    entityManager?: EntityManager,
    id?: string,
  ) {
    const semester = await this.getOne(
      {
        where: {
          name,
          ...(id && { id: Not(id) }),
        },
      },
      entityManager,
    );

    if (semester) {
      throw new ExistsException(EntityName.Semester);
    }

    return true;
  }

  /**
   * Checks if the given semester dates overlap with existing semesters
   */
  async checkDateOverlap(
    startDate: Date,
    endDate: Date,
    id?: string,
  ): Promise<boolean> {
    // Validate start date is before end date
    if (startDate >= endDate) {
      throw new BadRequestException('Start date must be before end date');
    }

    const overlappingSemester = await this.semesterRepository.findOne({
      where: [
        // Case 1: New semester starts during an existing semester
        {
          startDate: LessThan(startDate),
          endDate: MoreThan(startDate),
          ...(id && { id: Not(id) }),
        },
        // Case 2: New semester ends during an existing semester
        {
          startDate: LessThan(endDate),
          endDate: MoreThan(endDate),
          ...(id && { id: Not(id) }),
        },
        // Case 3: New semester completely contains an existing semester
        {
          startDate: MoreThan(startDate),
          endDate: LessThan(endDate),
          ...(id && { id: Not(id) }),
        },
      ],
    });

    if (overlappingSemester) {
      throw new BadRequestException(
        `Semester dates overlap with existing semester: ${overlappingSemester.name}`,
      );
    }

    return true;
  }

  /**
   * Updates the status of semesters based on their dates
   */
  async updateSemesterStatuses(): Promise<void> {
    const today = new Date();

    // Find active semesters that have ended
    const completedSemesters = await this.semesterRepository.find({
      where: {
        status: SemesterStatus.Active,
        endDate: LessThan(today),
      },
    });

    // Find upcoming semesters that have started
    const activeSemesters = await this.semesterRepository.find({
      where: {
        status: SemesterStatus.Upcoming,
        startDate: LessThan(today),
        endDate: MoreThan(today),
      },
    });

    // Update completed semesters
    if (completedSemesters.length > 0) {
      await this.semesterRepository.update(
        completedSemesters.map((s) => s.id),
        { status: SemesterStatus.Completed, currentSemester: false },
      );
    }

    // Update active semesters
    if (activeSemesters.length > 0) {
      // First, set all semesters to not current
      await this.semesterRepository.update({}, { currentSemester: false });

      // Then make the current one active and current
      await this.semesterRepository.update(
        activeSemesters.map((s) => s.id),
        { status: SemesterStatus.Active, currentSemester: true },
      );
    }
  }

  async create(dto: CreateSemesterDto, entityManager?: EntityManager) {
    await this.isNameAvailable(dto.name);

    // Check for date overlaps
    await this.checkDateOverlap(dto.startDate, dto.endDate);

    // Determine status based on dates
    const today = new Date();
    let status = SemesterStatus.Upcoming;

    if (dto.startDate <= today && today <= dto.endDate) {
      status = SemesterStatus.Active;
    } else if (today > dto.endDate) {
      status = SemesterStatus.Completed;
    }

    // Extract academic year if not provided
    const academicYear =
      dto.academicYear || this.extractAcademicYear(dto.startDate, dto.endDate);

    const manager = this.getRepository(entityManager);

    const semester = await manager.save({
      name: dto.name,
      startDate: dto.startDate,
      endDate: dto.endDate,
      status: dto.status || status,
      currentSemester: dto.currentSemester || false,
      academicYear,
      description: dto.description,
    });

    // If this is set as current semester, update others
    // if (semester.currentSemester) {
    //   await manager.update(
    //     Semester,
    //     { id: Not(semester.id) },
    //     { currentSemester: false },
    //   );
    // }

    return semester;
  }

  async update(id: string, dto: UpdateSemesterDto) {
    const semester = await this.getOneOrThrow({
      where: { id },
    });

    if (dto.name) {
      await this.isNameAvailable(dto.name, undefined, id);
    }

    // Check for date overlaps if dates are being updated
    if (dto.startDate || dto.endDate) {
      const startDate = dto.startDate || semester.startDate;
      const endDate = dto.endDate || semester.endDate;
      await this.checkDateOverlap(startDate, endDate, id);
    }

    // Update fields
    Object.assign(semester, dto);

    // If academic year is being updated based on new dates
    if ((dto.startDate || dto.endDate) && !dto.academicYear) {
      semester.academicYear = this.extractAcademicYear(
        semester.startDate,
        semester.endDate,
      );
    }

    // If this is set as current semester, update others
    if (dto.currentSemester === true) {
      await this.semesterRepository.update(
        { id: Not(id) },
        { currentSemester: false },
      );
    }

    return this.semesterRepository.save(semester);
  }

  async delete(id: string) {
    // Check if semester exists
    const semester = await this.getOneOrThrow({
      where: { id },
      relations: ['classes'],
    });

    // Check if semester has associated classes
    if (semester.classes && semester.classes.length > 0) {
      throw new BadRequestException(
        `Cannot delete semester "${semester.name}" as it has ${semester.classes.length} classes associated with it.`,
      );
    }

    await this.semesterRepository.delete({ id });

    return {
      success: true,
      message: `Semester "${semester.name}" deleted successfully`,
    };
  }

  /**
   * Generates an academic calendar for the specified number of years
   */
  async generateAcademicCalendar(
    dto: GenerateAcademicCalendarDto,
  ): Promise<Semester[]> {
    const results: Semester[] = [];
    const years = dto.numberOfYears || 1;

    // Validate dates
    if (
      dto.firstSemesterStartDate >= dto.firstSemesterEndDate ||
      dto.secondSemesterStartDate >= dto.secondSemesterEndDate
    ) {
      throw new BadRequestException('Start dates must be before end dates');
    }

    for (let i = 0; i < years; i++) {
      const yearOffset = i * 365; // Approximate a year in days

      // Extract starting academic year
      const match = dto.startingAcademicYear.match(/^(\d{4})-(\d{4})$/);
      if (!match) {
        throw new BadRequestException(
          'Academic year must be in format YYYY-YYYY',
        );
      }

      const startingYear = parseInt(match[1]);
      const academicYear = `${startingYear + i}-${startingYear + i + 1}`;

      // Create fall semester
      const fallStart = new Date(dto.firstSemesterStartDate);
      fallStart.setDate(fallStart.getDate() + yearOffset);

      const fallEnd = new Date(dto.firstSemesterEndDate);
      fallEnd.setDate(fallEnd.getDate() + yearOffset);

      const fallSemester = await this.create({
        name: `Fall ${startingYear + i}`,
        startDate: fallStart,
        endDate: fallEnd,
        academicYear,
        description: `Fall semester for ${academicYear} academic year`,
      });

      results.push(fallSemester);

      // Create spring semester
      const springStart = new Date(dto.secondSemesterStartDate);
      springStart.setDate(springStart.getDate() + yearOffset);

      const springEnd = new Date(dto.secondSemesterEndDate);
      springEnd.setDate(springEnd.getDate() + yearOffset);

      const springSemester = await this.create({
        name: `Spring ${startingYear + i + 1}`,
        startDate: springStart,
        endDate: springEnd,
        academicYear,
        description: `Spring semester for ${academicYear} academic year`,
      });

      results.push(springSemester);

      // Create summer semester if provided
      if (dto.summerSemester) {
        const summerStart = new Date(dto.summerSemester.startDate);
        summerStart.setDate(summerStart.getDate() + yearOffset);

        const summerEnd = new Date(dto.summerSemester.endDate);
        summerEnd.setDate(summerEnd.getDate() + yearOffset);

        const summerSemester = await this.create({
          name: `Summer ${startingYear + i + 1}`,
          startDate: summerStart,
          endDate: summerEnd,
          academicYear,
          description: `Summer semester for ${academicYear} academic year`,
        });

        results.push(summerSemester);
      }
    }

    return results;
  }

  /**
   * Gets the current active semester
   */
  async getCurrentSemester(): Promise<Semester> {
    // First try by currentSemester flag
    const currentSemester = await this.semesterRepository.findOne({
      where: { currentSemester: true },
    });

    if (currentSemester) {
      return currentSemester;
    }

    // If no semester is marked as current, try by date range
    const today = new Date();
    const activeSemester = await this.semesterRepository.findOne({
      where: {
        startDate: LessThan(today),
        endDate: MoreThan(today),
        status: SemesterStatus.Active,
      },
    });

    if (activeSemester) {
      return activeSemester;
    }

    // If no active semester, get the upcoming one
    const upcomingSemester = await this.semesterRepository.findOne({
      where: {
        startDate: MoreThan(today),
        status: SemesterStatus.Upcoming,
      },
      order: { startDate: 'ASC' },
    });

    if (upcomingSemester) {
      return upcomingSemester;
    }

    throw new NotFoundException('No current or upcoming semester found');
  }

  /**
   * Extracts the academic year string from semester dates
   */
  private extractAcademicYear(startDate: Date, endDate: Date): string {
    const startYear = startDate.getFullYear();
    const endYear = endDate.getFullYear();

    // For spring/summer semesters that end in the same year as start
    if (startYear === endYear) {
      // If it's early in the year, it's likely part of previous academic year
      if (startDate.getMonth() < 6) {
        // Before July
        return `${startYear - 1}-${startYear}`;
      }
      return `${startYear}-${startYear + 1}`;
    }

    // For fall semesters that end in the next year
    return `${startYear}-${endYear}`;
  }

  /**
   * Assigns courses to a semester
   */
  async assignCourses(
    semesterId: string,
    courseIds: string[],
  ): Promise<Semester> {
    const semester = await this.getOneOrThrow({
      where: { id: semesterId },
      relations: ['courses'],
    });

    const courses = await this.courseRepository.findBy({ id: In(courseIds) });

    if (courses.length !== courseIds.length) {
      throw new BadRequestException('One or more courses not found');
    }

    // Add courses to semester
    semester.courses = semester.courses || [];
    semester.courses = [...semester.courses, ...courses];

    return this.semesterRepository.save(semester);
  }
}
