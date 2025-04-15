import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { AttendanceStatus } from 'src/shared/constants';

/**
 * DTO for updating an existing attendance record.
 * All fields are optional.
 */
export class UpdateAttendanceDto {
  @ApiPropertyOptional({
    description: 'The ID of the enrollment this attendance record belongs to.',
    example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
  })
  @IsOptional()
  @IsUUID()
  enrollmentId?: string;

  @ApiPropertyOptional({
    description: 'The date of the attendance record.',
    example: '2025-04-16',
    type: String,
    format: 'date',
  })
  @IsOptional()
  @IsDateString()
  attendanceDate?: string; // Use string for input, convert to Date in service

  @ApiPropertyOptional({
    description: 'The attendance status.',
    enum: AttendanceStatus,
    example: AttendanceStatus.Absent,
  })
  @IsOptional()
  @IsEnum(AttendanceStatus)
  status?: AttendanceStatus;

  @ApiPropertyOptional({
    description: 'Optional notes regarding the attendance.',
    example: 'Absent due to illness.',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
