import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDate,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class UpdateSemesterDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @IsDate()
  @IsOptional()
  @Type(() => Date)
  startDate?: Date;

  @IsDate()
  @IsOptional()
  @Type(() => Date)
  endDate?: Date;

  @IsOptional()
  @IsBoolean()
  currentSemester?: boolean;
}
