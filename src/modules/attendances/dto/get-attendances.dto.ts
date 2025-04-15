import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsDateString, IsEnum, IsOptional, IsUUID } from 'class-validator';
import { AttendanceStatus } from 'src/shared/constants';
import { PaginationDto } from 'src/shared/dto';

/**
 * DTO for querying attendance records with pagination and filtering.
 */
export class GetAttendancesDto extends PaginationDto {
  @ApiPropertyOptional({
    description: 'Filter by enrollment ID.',
    example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
  })
  @IsOptional()
  @IsUUID()
  enrollmentId?: string;

  @ApiPropertyOptional({
    description: 'Filter by attendance date (YYYY-MM-DD).',
    example: '2025-04-15',
    type: String,
    format: 'date',
  })
  @IsOptional()
  @IsDateString()
  attendanceDate?: string;

  @ApiPropertyOptional({
    description: 'Filter by start date (YYYY-MM-DD).',
    example: '2025-04-01',
    type: String,
    format: 'date',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'Filter by end date (YYYY-MM-DD).',
    example: '2025-04-30',
    type: String,
    format: 'date',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Filter by attendance status.',
    enum: AttendanceStatus,
    example: AttendanceStatus.Present,
  })
  @IsOptional()
  @IsEnum(AttendanceStatus)
  status?: AttendanceStatus;

  @ApiPropertyOptional({
    description: 'Include enrollment details.',
    type: Boolean,
    example: true,
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  includeEnrollment?: boolean = false;
}
