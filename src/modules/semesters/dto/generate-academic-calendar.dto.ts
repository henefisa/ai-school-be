import { Type } from 'class-transformer';
import {
  IsArray,
  IsDate,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

class SemesterPeriod {
  @IsDate()
  @Type(() => Date)
  startDate: Date;

  @IsDate()
  @Type(() => Date)
  endDate: Date;
}

class Holiday {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsDate()
  @Type(() => Date)
  startDate: Date;

  @IsDate()
  @Type(() => Date)
  endDate: Date;
}

export class GenerateAcademicCalendarDto {
  @ApiProperty({
    description: 'The starting academic year (e.g., 2023-2024)',
    example: '2023-2024',
  })
  @IsString()
  @IsNotEmpty()
  startingAcademicYear: string;

  @ApiProperty({
    description: 'The number of academic years to generate',
    example: 1,
    minimum: 1,
    maximum: 5,
    default: 1,
  })
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(5)
  numberOfYears?: number = 1;

  @ApiProperty({
    description: 'The start date of the first semester',
    example: '2023-09-01',
  })
  @IsDate()
  @IsNotEmpty()
  @Type(() => Date)
  firstSemesterStartDate: Date;

  @ApiProperty({
    description: 'The end date of the first semester',
    example: '2023-12-31',
  })
  @IsDate()
  @IsNotEmpty()
  @Type(() => Date)
  firstSemesterEndDate: Date;

  @ApiProperty({
    description: 'The start date of the second semester',
    example: '2024-01-15',
  })
  @IsDate()
  @IsNotEmpty()
  @Type(() => Date)
  secondSemesterStartDate: Date;

  @ApiProperty({
    description: 'The end date of the second semester',
    example: '2024-05-31',
  })
  @IsDate()
  @IsNotEmpty()
  @Type(() => Date)
  secondSemesterEndDate: Date;

  @ApiProperty({
    description: 'Optional start and end dates for summer semester',
    required: false,
    type: SemesterPeriod,
    example: {
      startDate: '2024-06-15',
      endDate: '2024-08-15',
    },
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => SemesterPeriod)
  summerSemester?: SemesterPeriod;

  @ApiProperty({
    description: 'Holidays and breaks to include in the calendar',
    required: false,
    type: [Holiday],
    example: [
      {
        name: 'Winter Break',
        startDate: '2023-12-15',
        endDate: '2024-01-05',
      },
      {
        name: 'Spring Break',
        startDate: '2024-03-10',
        endDate: '2024-03-17',
      },
    ],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => Holiday)
  holidays?: Holiday[];
}
