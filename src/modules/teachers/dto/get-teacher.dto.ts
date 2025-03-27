import { PartialType } from '@nestjs/swagger';
import { PaginationDto } from 'src/shared/dto';

export class GetTeachersDto extends PartialType(PaginationDto) {}
