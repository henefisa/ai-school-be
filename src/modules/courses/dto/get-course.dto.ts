import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';

export class GetCourseDto {
  @ApiProperty({
    example: 'true',
    description: 'Whether to include the department in the response',
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  includeDepartment?: boolean;
}
