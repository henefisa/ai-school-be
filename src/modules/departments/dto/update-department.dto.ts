import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateDepartmentDto } from './create-department.dto';
import { IsOptional, IsString } from 'class-validator';

export class UpdateDepartmentDto extends PartialType(CreateDepartmentDto) {
  @ApiProperty({
    example: 'Computer Science',
    description: 'Name of the department',
    required: false,
  })
  @IsString()
  @IsOptional()
  override name?: string;

  @ApiProperty({
    example: 'CS',
    description: 'Unique code/ID for the department',
    required: false,
  })
  @IsString()
  @IsOptional()
  override code?: string;
}
