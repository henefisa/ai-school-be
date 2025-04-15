import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { AttendanceStatus } from 'src/shared/constants';

/**
 * DTO for creating a new attendance record.
 */
export class CreateAttendanceDto {
  @ApiProperty({
    description: 'The ID of the enrollment this attendance record belongs to.',
    example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
  })
  @IsNotEmpty()
  @IsUUID()
  enrollmentId: string;

  @ApiProperty({
    description: 'The date of the attendance record.',
    example: '2025-04-15',
    type: String,
    format: 'date',
  })
  @IsNotEmpty()
  @IsDateString()
  attendanceDate: string; // Use string for input, convert to Date in service

  @ApiProperty({
    description: 'The attendance status.',
    enum: AttendanceStatus,
    example: AttendanceStatus.Present,
  })
  @IsNotEmpty()
  @IsEnum(AttendanceStatus)
  status: AttendanceStatus;

  @ApiProperty({
    description: 'Optional notes regarding the attendance.',
    example: 'Arrived 10 minutes late.',
    required: false,
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
