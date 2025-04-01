import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsUUID } from 'class-validator';
import { Transform } from 'class-transformer';

export class GetDepartmentDto {
  @ApiProperty({
    example: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
    description: 'UUID of the department',
  })
  @IsUUID()
  id: string;

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
