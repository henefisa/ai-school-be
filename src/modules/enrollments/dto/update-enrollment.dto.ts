import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { EnrollmentStatus } from 'src/shared/constants';

export class UpdateEnrollmentDto {
  @IsOptional()
  @IsEnum(EnrollmentStatus)
  @ApiProperty({
    description: 'The new status of the enrollment',
    enum: EnrollmentStatus,
    example: EnrollmentStatus.Dropped,
    required: false,
  })
  status?: EnrollmentStatus;

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: 'Reason for status change',
    example: 'Student requested withdrawal due to schedule conflict',
    required: false,
  })
  reason?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: 'Additional notes for the enrollment',
    example: 'Student has special accommodation requirements',
    required: false,
  })
  notes?: string;
}
