import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { PaginationDto } from 'src/shared/dto/pagination.dto';

export class GetParentsDto extends PaginationDto {
  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  status?: boolean;
}
