import { ApiProperty } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';
import { IsNumber, IsOptional, Max, Min } from 'class-validator';

export class PaginationDto {
  @IsNumber()
  @Transform(({ value }: { value: string }) => parseInt(value))
  @Min(1)
  @IsOptional()
  @ApiProperty({ example: 1 })
  page?: number = 1;

  @IsNumber()
  @Transform(({ value }: { value: string }) => parseInt(value))
  @Min(1)
  @Max(50)
  @IsOptional()
  @ApiProperty({ example: 10 })
  pageSize?: number = 10;

  @Expose()
  @Transform(({ obj: { page = 1, pageSize = 10 } }: { obj: PaginationDto }) => {
    return (page - 1) * pageSize;
  })
  readonly skip?: number;
}
