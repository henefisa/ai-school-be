import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';

export class GetTeacherDto {
  @ApiProperty({
    example: 'true',
    description: 'Whether to include the addresses in the response',
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  includeTeacherAddresses?: boolean;

  @ApiProperty({
    example: 'true',
    description: 'Whether to include the departments in the response',
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  includeDepartments?: boolean;

  @ApiProperty({
    example: 'true',
    description: 'Whether to include the user in the response',
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  includeUser?: boolean;
}
