import { ApiProperty, PartialType } from '@nestjs/swagger';
import { PaginationDto } from 'src/shared/dto';
import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { DayOfWeek } from 'src/shared/constants';

export class GetClassesDto extends PartialType(PaginationDto) {
  @IsOptional()
  @IsString()
  @ApiProperty({
    required: false,
    description: 'Filter by class name',
    example: 'Computer Science',
  })
  name?: string;

  @IsOptional()
  @IsUUID(4)
  @ApiProperty({
    required: false,
    description: 'Filter by course ID',
    example: 'b85bd229-f5a9-459d-8887-69970ffeb500',
  })
  courseId?: string;

  @IsOptional()
  @IsUUID(4)
  @ApiProperty({
    required: false,
    description: 'Filter by semester ID',
    example: 'c85bd329-f5a9-459d-8887-69970ffeb600',
  })
  semesterId?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    required: false,
    description: 'Filter by grade level',
    example: 'Freshman',
  })
  gradeLevel?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    required: false,
    description: 'Filter by section',
    example: 'A',
  })
  section?: string;

  @IsOptional()
  @IsEnum(DayOfWeek)
  @ApiProperty({
    required: false,
    description: 'Filter by day of week',
    enum: DayOfWeek,
    example: DayOfWeek.Monday,
  })
  dayOfWeek?: DayOfWeek;

  @IsOptional()
  @IsUUID(4)
  @ApiProperty({
    required: false,
    description: 'Filter by room ID',
    example: 'd85bd429-f5a9-459d-8887-69970ffeb700',
  })
  roomId?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    required: false,
    description: 'Filter by status',
    example: 'ACTIVE',
  })
  status?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    required: false,
    description: 'Sort field',
    example: 'name',
  })
  sortBy?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    required: false,
    description: 'Sort order',
    enum: ['ASC', 'DESC'],
    example: 'ASC',
  })
  sortOrder?: 'ASC' | 'DESC';
}
