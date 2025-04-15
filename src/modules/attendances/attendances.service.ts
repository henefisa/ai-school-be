import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Attendance } from 'src/typeorm/entities/attendance.entity';
import {
  Between,
  FindOptionsWhere,
  LessThanOrEqual,
  MoreThanOrEqual,
  Repository,
} from 'typeorm';
import { CreateAttendanceDto } from './dto/create-attendance.dto';
import { UpdateAttendanceDto } from './dto/update-attendance.dto';
import { GetAttendancesDto } from './dto/get-attendances.dto';
import { BaseService } from 'src/shared/base.service';
import { EntityName } from 'src/shared/error-messages';
import { EnrollmentsService } from '../enrollments/enrollments.service'; // Import EnrollmentsService

@Injectable()
export class AttendancesService extends BaseService<Attendance> {
  constructor(
    @InjectRepository(Attendance)
    private readonly attendanceRepository: Repository<Attendance>,
    private readonly enrollmentsService: EnrollmentsService, // Inject EnrollmentsService
  ) {
    super(EntityName.Attendance, attendanceRepository);
  }

  /**
   * Creates a new attendance record.
   * Validates that the associated enrollment exists.
   * @param dto - Data for creating the attendance record.
   * @returns The newly created attendance record.
   */
  async create(dto: CreateAttendanceDto): Promise<Attendance> {
    // Validate that the enrollment exists
    await this.enrollmentsService.getOneOrThrow({
      where: { id: dto.enrollmentId },
    });

    const attendanceData: Partial<Attendance> = {
      ...dto,
      attendanceDate: new Date(dto.attendanceDate), // Convert string date to Date object
    };

    const attendance = this.attendanceRepository.create(attendanceData);
    return this.attendanceRepository.save(attendance);
  }

  /**
   * Retrieves attendance records based on filtering and pagination criteria.
   * @param dto - DTO containing query parameters.
   * @returns A list of attendance records and the total count.
   */
  async findAll(
    dto: GetAttendancesDto,
  ): Promise<{ results: Attendance[]; count: number }> {
    const where: FindOptionsWhere<Attendance> = {};

    if (dto.enrollmentId) {
      where.enrollmentId = dto.enrollmentId;
    }
    if (dto.status) {
      where.status = dto.status;
    }

    // Handle date filtering
    if (dto.attendanceDate) {
      // Ensure the date is treated correctly without time component issues
      const targetDate = new Date(dto.attendanceDate);
      targetDate.setUTCHours(0, 0, 0, 0); // Normalize to UTC start of day
      where.attendanceDate = targetDate;
    } else if (dto.startDate && dto.endDate) {
      const startDate = new Date(dto.startDate);
      startDate.setUTCHours(0, 0, 0, 0);
      const endDate = new Date(dto.endDate);
      endDate.setUTCHours(0, 0, 0, 0);
      where.attendanceDate = Between(startDate, endDate);
    } else if (dto.startDate) {
      const startDate = new Date(dto.startDate);
      startDate.setUTCHours(0, 0, 0, 0);
      where.attendanceDate = MoreThanOrEqual(startDate);
    } else if (dto.endDate) {
      const endDate = new Date(dto.endDate);
      endDate.setUTCHours(0, 0, 0, 0);
      where.attendanceDate = LessThanOrEqual(endDate);
    }

    const [results, count] = await this.attendanceRepository.findAndCount({
      where,
      relations: {
        enrollment: dto.includeEnrollment, // Conditionally include enrollment
      },
      skip: dto.skip,
      take: dto.pageSize ?? 10,
      order: {
        attendanceDate: 'DESC', // Default order by date descending
      },
    });

    return { results, count };
  }

  /**
   * Retrieves a single attendance record by its ID.
   * @param id - The ID of the attendance record.
   * @returns The found attendance record.
   * @throws NotFoundException if the record doesn't exist.
   */
  async findOne(id: string): Promise<Attendance> {
    return this.getOneOrThrow({ where: { id } });
  }

  /**
   * Updates an existing attendance record.
   * @param id - The ID of the attendance record to update.
   * @param dto - Data for updating the attendance record.
   * @returns The updated attendance record.
   * @throws NotFoundException if the record doesn't exist.
   */
  async update(id: string, dto: UpdateAttendanceDto): Promise<Attendance> {
    const attendance = await this.findOne(id); // Ensure attendance exists

    // If enrollmentId is being updated, validate the new enrollment exists
    if (dto.enrollmentId && dto.enrollmentId !== attendance.enrollmentId) {
      await this.enrollmentsService.getOneOrThrow({
        where: { id: dto.enrollmentId },
      });
    }

    // Exclude attendanceDate from direct spread to handle type conversion
    const { attendanceDate, ...restDto } = dto;
    const updateData: Partial<Attendance> = { ...restDto };

    // Convert date string if provided
    if (attendanceDate) {
      updateData.attendanceDate = new Date(attendanceDate);
    }

    Object.assign(attendance, updateData);
    return this.attendanceRepository.save(attendance);
  }

  /**
   * Deletes an attendance record by its ID.
   * @param id - The ID of the attendance record to delete.
   * @throws NotFoundException if the record doesn't exist.
   */
  async remove(id: string): Promise<void> {
    await this.findOne(id); // Ensure attendance exists before deleting
    await this.attendanceRepository.softDelete(id);
  }
}
