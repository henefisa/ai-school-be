import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class DropEnrollmentDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: 'Reason for dropping the course',
    example: 'Schedule conflict with another required course',
  })
  reason: string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: 'Additional notes',
    example: 'Student plans to re-enroll next semester',
    required: false,
  })
  notes?: string;
}
