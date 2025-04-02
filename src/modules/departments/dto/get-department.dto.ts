import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';

export class GetDepartmentDto {
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
    description: 'Whether to include courses in the response',
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  includeCourses?: boolean;

  @ApiProperty({
    example: 'true',
    description: 'Whether to include teachers in the response',
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  includeTeachers?: boolean;
}
