import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCourseDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: 'Introduction to Computer Science' })
  name: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: 'CS101' })
  code: string;

  @IsString()
  @IsOptional()
  @ApiProperty({
    example:
      'Fundamental concepts of computer programming and software development',
  })
  description?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @ApiProperty({ example: 3 })
  credits?: number;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  @ApiProperty({ example: true })
  required?: boolean;

  @IsOptional()
  @IsUUID(4)
  @ApiProperty({ example: 'b85bd229-f5a9-459d-8887-69970ffeb500' })
  departmentId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  @ApiProperty({ example: 'ACTIVE' })
  status?: string;
}
