import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class AddPrerequisiteDto {
  @IsNotEmpty()
  @IsUUID()
  @ApiProperty({
    description: 'ID of the prerequisite course',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  prerequisiteId: string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: 'Minimum grade required to satisfy the prerequisite',
    example: 'C',
    required: false,
  })
  minGrade?: string;

  @IsOptional()
  @IsBoolean()
  @ApiProperty({
    description: 'Whether this prerequisite is required or recommended',
    example: true,
    default: true,
    required: false,
  })
  isRequired?: boolean;

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: 'Additional notes about the prerequisite',
    example: 'Students with equivalent transfer credits may be exempted',
    required: false,
  })
  notes?: string;
}
