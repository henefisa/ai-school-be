import { Type } from 'class-transformer';
import { IsDate, IsEnum, IsNumber, IsString, IsUUID } from 'class-validator';
import { DayOfWeek } from 'src/shared/constants';

export class CreateClassDto {
  @IsUUID(4)
  courseId: string;

  @IsUUID(4)
  semesterId: string;

  @IsString()
  name: string;

  @IsDate()
  @Type(() => Date)
  startTime?: Date;

  @IsDate()
  @Type(() => Date)
  endTime?: Date;

  @IsEnum(DayOfWeek)
  dayOfWeek: DayOfWeek;

  @IsNumber()
  maxEnrollment: number;
}
