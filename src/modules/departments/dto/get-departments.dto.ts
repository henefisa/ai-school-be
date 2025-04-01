import { ApiProperty, PartialType } from '@nestjs/swagger';
import { PaginationDto } from 'src/shared/dto';
import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

export class GetDepartmentsDto extends PartialType(PaginationDto) {
  @ApiProperty({
    example: 'Computer',
    description:
      'Search term to filter departments by name, code, or description',
    required: false,
  })
  @IsString()
  @IsOptional()
  q?: string;

  @ApiProperty({
    example: 'true',
    description: 'Whether to include the head teacher in the response',
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  includeHead?: boolean;

  @ApiProperty({
    example: 'true',
    description: 'Whether to include courses count in the response',
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  includeCoursesCount?: boolean;

  @ApiProperty({
    example: 'true',
    description: 'Whether to include teachers count in the response',
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  includeTeachersCount?: boolean;
}
