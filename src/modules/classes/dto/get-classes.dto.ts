import { PartialType } from '@nestjs/swagger';
import { PaginationDto } from 'src/shared/dto';

export class GetClassesDto extends PartialType(PaginationDto) {}
