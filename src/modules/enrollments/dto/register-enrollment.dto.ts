import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class RegisterEnrollmentDto {
  @IsUUID()
  @IsNotEmpty()
  @ApiProperty({
    description: 'The ID of the class to enroll in',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  classId: string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: 'Additional notes for the enrollment',
    example: 'Student has special accommodation requirements',
    required: false,
  })
  notes?: string;
}
