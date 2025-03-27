import { PartialType } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { PaginationDto } from 'src/shared/dto';

export class GetStudentsDto extends PartialType(PaginationDto) {
  @IsOptional()
  @IsString()
  q?: string;
  @IsOptional()
  @IsBoolean()
  status?: boolean;
}
