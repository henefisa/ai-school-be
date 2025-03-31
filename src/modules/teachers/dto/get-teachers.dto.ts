import { PartialType } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean } from 'class-validator';
import { IsString } from 'class-validator';
import { IsOptional } from 'class-validator';
import { PaginationDto } from 'src/shared/dto';

export class GetTeachersDto extends PartialType(PaginationDto) {
  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  status?: boolean;
}
