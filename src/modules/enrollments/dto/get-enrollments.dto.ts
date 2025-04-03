import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { EnrollmentStatus } from 'src/shared/constants';
import { PaginationDto } from 'src/shared/dto';

export class GetEnrollmentsDto extends PaginationDto {
  @IsOptional()
  @IsUUID()
  @ApiProperty({
    description: 'Filter by student ID',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    required: false,
  })
  studentId?: string;

  @IsOptional()
  @IsUUID()
  @ApiProperty({
    description: 'Filter by class ID',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    required: false,
  })
  classId?: string;

  @IsOptional()
  @IsUUID()
  @ApiProperty({
    description: 'Filter by course ID',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    required: false,
  })
  courseId?: string;

  @IsOptional()
  @IsEnum(EnrollmentStatus)
  @ApiProperty({
    description: 'Filter by enrollment status',
    enum: EnrollmentStatus,
    example: EnrollmentStatus.Active,
    required: false,
  })
  status?: EnrollmentStatus;

  @IsOptional()
  @Type(() => Date)
  @ApiProperty({
    description: 'Filter enrollments after this date',
    example: '2023-09-01',
    required: false,
  })
  startDate?: Date;

  @IsOptional()
  @Type(() => Date)
  @ApiProperty({
    description: 'Filter enrollments before this date',
    example: '2023-12-31',
    required: false,
  })
  endDate?: Date;

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: 'Search query for student name',
    example: 'Smith',
    required: false,
  })
  q?: string;
}
