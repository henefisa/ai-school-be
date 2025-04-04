import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger';
import { PaginationDto } from 'src/shared/dto';
import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { Transform } from 'class-transformer';

enum SortOrder {
  ASC = 'ASC',
  DESC = 'DESC',
}

export class GetCoursesDto extends PartialType(PaginationDto) {
  @IsOptional()
  @IsString()
  @ApiProperty({
    required: false,
    description: 'Filter by course name',
    example: 'Introduction',
  })
  name?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    required: false,
    description: 'Filter by course code',
    example: 'CS101',
  })
  code?: string;

  @IsOptional()
  @IsUUID(4)
  @ApiProperty({
    required: false,
    description: 'Filter by department ID',
    example: 'b85bd229-f5a9-459d-8887-69970ffeb500',
  })
  departmentId?: string;

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
  @IsEnum(SortOrder)
  @ApiProperty({
    required: false,
    enum: SortOrder,
    description: 'Sort order',
    example: 'ASC',
  })
  sortOrder?: SortOrder;

  @ApiProperty({
    example: 'true',
    description: 'Whether to include the head teacher in the response',
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  includeDepartment?: boolean;
}

export class GetCourseByDepartmentDto extends PartialType(
  OmitType(GetCoursesDto, ['departmentId'] as const),
) {}
