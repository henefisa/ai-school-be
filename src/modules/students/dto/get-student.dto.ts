import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';

export class GetStudentDto {
  @ApiProperty({
    example: 'true',
    description: 'Whether to include the user in the response',
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  includeUser?: boolean;

  @ApiProperty({
    example: 'true',
    description: 'Whether to include the addresses in the response',
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  includeAddresses?: boolean;

  @ApiProperty({
    example: 'true',
    description: 'Whether to include the parent in the response',
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  includeParent?: boolean;
}
