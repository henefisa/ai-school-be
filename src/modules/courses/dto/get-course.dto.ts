import { PartialType } from '@nestjs/swagger';
import { PaginationDto } from 'src/shared/dto';

export class GetCoursesDto extends PartialType(PaginationDto) {}
