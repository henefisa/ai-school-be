import { Type } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
import { DayOfWeek } from 'src/shared/constants';
import { ApiProperty } from '@nestjs/swagger';

export class CreateClassDto {
  @IsUUID(4)
  @ApiProperty({
    example: 'b85bd229-f5a9-459d-8887-69970ffeb500',
    description: 'Course ID that this class is associated with',
  })
  courseId: string;

  @IsUUID(4)
  @ApiProperty({
    example: 'c85bd329-f5a9-459d-8887-69970ffeb600',
    description: 'Semester ID that this class belongs to',
  })
  semesterId: string;

  @IsString()
  @MaxLength(100)
  @ApiProperty({
    example: 'Introduction to Computer Science - Morning Section',
    description: 'Name of the class',
  })
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  @ApiProperty({
    example: 'Freshman',
    description: 'Grade level of the class',
    required: false,
  })
  gradeLevel?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  @ApiProperty({
    example: 'A',
    description: 'Section/batch identifier of the class',
    required: false,
  })
  section?: string;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  @ApiProperty({
    example: '2023-09-01T09:00:00.000Z',
    description: 'Start time of the class',
    required: false,
  })
  startTime?: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  @ApiProperty({
    example: '2023-09-01T10:30:00.000Z',
    description: 'End time of the class',
    required: false,
  })
  endTime?: Date;

  @IsEnum(DayOfWeek)
  @ApiProperty({
    enum: DayOfWeek,
    example: DayOfWeek.Monday,
    description: 'Day of the week when the class is scheduled',
  })
  dayOfWeek: DayOfWeek;

  @IsOptional()
  @IsUUID(4)
  @ApiProperty({
    example: 'd85bd429-f5a9-459d-8887-69970ffeb700',
    description: 'Room ID where the class is held',
    required: false,
  })
  roomId?: string;

  @IsNumber()
  @Min(1)
  @ApiProperty({
    example: 30,
    description: 'Maximum number of students allowed in the class',
    minimum: 1,
  })
  maxEnrollment: number;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  @ApiProperty({
    example: 'ACTIVE',
    description: 'Status of the class (ACTIVE, CANCELLED, COMPLETED, etc.)',
    required: false,
    default: 'ACTIVE',
  })
  status?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    example: 'This class will cover the fundamentals of computer science.',
    description: 'Additional description of the class',
    required: false,
  })
  description?: string;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  @ApiProperty({
    example: '2023-09-01',
    description: 'Start date of the class',
    required: false,
  })
  startDate?: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  @ApiProperty({
    example: '2023-12-15',
    description: 'End date of the class',
    required: false,
  })
  endDate?: Date;
}
