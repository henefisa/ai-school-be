import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { SemesterStatus } from 'src/shared/constants';

export class UpdateSemesterDto {
  @ApiProperty({
    description: 'The name of the semester',
    example: 'Fall 2023',
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @ApiProperty({
    description: 'The start date of the semester',
    example: '2023-09-01',
    required: false,
  })
  @IsDate()
  @IsOptional()
  @Type(() => Date)
  startDate?: Date;

  @ApiProperty({
    description: 'The end date of the semester',
    example: '2023-12-31',
    required: false,
  })
  @IsDate()
  @IsOptional()
  @Type(() => Date)
  endDate?: Date;

  @ApiProperty({
    description: 'The status of the semester',
    enum: SemesterStatus,
    example: SemesterStatus.Active,
    required: false,
  })
  @IsEnum(SemesterStatus)
  @IsOptional()
  status?: SemesterStatus;

  @ApiProperty({
    description: 'Whether this is the current semester',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  currentSemester?: boolean;

  @ApiProperty({
    description: 'The academic year for this semester (e.g., 2023-2024)',
    example: '2023-2024',
    required: false,
  })
  @IsString()
  @IsOptional()
  @Matches(/^\d{4}-\d{4}$/, {
    message: 'Academic year must be in the format YYYY-YYYY',
  })
  academicYear?: string;

  @ApiProperty({
    description: 'Additional description for the semester',
    example: 'Regular Fall semester with holiday break in November',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;
}
