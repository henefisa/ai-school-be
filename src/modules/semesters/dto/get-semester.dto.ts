import { PartialType } from '@nestjs/swagger';
import { PaginationDto } from 'src/shared/dto';

export class GetSemestersDto extends PartialType(PaginationDto) {}
