import { ApiProperty, PartialType } from '@nestjs/swagger';
import { PaginationDto } from 'src/shared/dto';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsOptional,
  IsString,
  IsBoolean,
} from 'class-validator';
import { SemesterStatus } from 'src/shared/constants';

export class GetSemestersDto extends PartialType(PaginationDto) {
  @ApiProperty({
    description: 'Filter by semester name',
    required: false,
    example: 'Fall 2023',
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({
    description: 'Filter by academic year',
    required: false,
    example: '2023-2024',
  })
  @IsString()
  @IsOptional()
  academicYear?: string;

  @ApiProperty({
    description: 'Filter by semester status',
    required: false,
    enum: SemesterStatus,
    example: SemesterStatus.Active,
  })
  @IsEnum(SemesterStatus)
  @IsOptional()
  status?: SemesterStatus;

  @ApiProperty({
    description: 'Filter by current semester flag',
    required: false,
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  currentSemester?: boolean;

  @ApiProperty({
    description: 'Filter for semesters starting after this date',
    required: false,
    example: '2023-01-01',
  })
  @IsDate()
  @IsOptional()
  @Type(() => Date)
  startDateFrom?: Date;

  @ApiProperty({
    description: 'Filter for semesters starting before this date',
    required: false,
    example: '2023-12-31',
  })
  @IsDate()
  @IsOptional()
  @Type(() => Date)
  startDateTo?: Date;

  @ApiProperty({
    description: 'Filter for semesters ending after this date',
    required: false,
    example: '2023-01-01',
  })
  @IsDate()
  @IsOptional()
  @Type(() => Date)
  endDateFrom?: Date;

  @ApiProperty({
    description: 'Filter for semesters ending before this date',
    required: false,
    example: '2023-12-31',
  })
  @IsDate()
  @IsOptional()
  @Type(() => Date)
  endDateTo?: Date;

  @ApiProperty({
    description: 'Sort field',
    required: false,
    enum: [
      'name',
      'startDate',
      'endDate',
      'status',
      'academicYear',
      'createdAt',
    ],
    default: 'startDate',
  })
  @IsString()
  @IsOptional()
  sortBy?: string = 'startDate';

  @ApiProperty({
    description: 'Sort direction',
    required: false,
    enum: ['ASC', 'DESC'],
    default: 'DESC',
  })
  @IsString()
  @IsOptional()
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}
