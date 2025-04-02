import { Type } from 'class-transformer';
import { IsDate, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AssignTeacherDto {
  @IsUUID(4)
  @ApiProperty({
    example: 'b85bd229-f5a9-459d-8887-69970ffeb500',
    description: 'ID of the teacher to assign',
  })
  teacherId: string;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  @ApiProperty({
    example: '2023-09-01',
    description: 'Start date of the teacher assignment',
    required: false,
  })
  startDate?: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  @ApiProperty({
    example: '2023-12-15',
    description: 'End date of the teacher assignment',
    required: false,
  })
  endDate?: Date;
}
