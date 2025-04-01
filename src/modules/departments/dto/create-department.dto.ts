import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class CreateDepartmentDto {
  @ApiProperty({
    example: 'Computer Science',
    description: 'Name of the department',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: 'CS',
    description: 'Unique code/ID for the department',
  })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({
    example: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
    description: 'UUID of the head of department (teacher)',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  headId?: string;

  @ApiProperty({
    example: 'Department focused on computer science and programming',
    description: 'Description of the department',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    example: 'Building A, Floor 2',
    description: 'Physical location of the department',
    required: false,
  })
  @IsString()
  @IsOptional()
  location?: string;

  @ApiProperty({
    example: 'cs@school.edu',
    description: 'Email contact for the department',
    required: false,
  })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({
    example: '(555) 123-4567',
    description: 'Phone number for the department',
    required: false,
  })
  @IsString()
  @IsOptional()
  phoneNumber?: string;
}
