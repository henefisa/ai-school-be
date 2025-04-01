import { Type } from 'class-transformer';
import { IsDate, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class EnrollStudentDto {
  @IsUUID(4)
  @ApiProperty({
    example: 'b85bd229-f5a9-459d-8887-69970ffeb500',
    description: 'ID of the student to enroll',
  })
  studentId: string;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  @ApiProperty({
    example: '2023-09-01',
    description: 'Date of enrollment',
    required: false,
    default: 'Current date',
  })
  enrollmentDate?: Date;
}
