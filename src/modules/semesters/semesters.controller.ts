import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { SemestersService } from './semesters.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/shared/guards/jwt-auth.guard';
import { RolesGuard } from 'src/shared/guards/roles.guard';
import { Roles } from 'src/shared/decorators/roles.decorator';
import { Role } from 'src/shared/constants';
import { GetSemestersDto } from './dto/get-semester.dto';
import { CreateSemesterDto } from './dto/create-semester.dto';
import { UpdateSemesterDto } from './dto/update-semester.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.Admin)
@ApiTags('Semesters')
@ApiBearerAuth()
@Controller({ path: 'semesters', version: '1' })
export class SemestersController {
  constructor(private readonly semestersService: SemestersService) {}

  @Get()
  async getSemesters(@Query() dto: GetSemestersDto) {
    return this.semestersService.getSemesters(dto);
  }

  @Post()
  async createSemester(@Body() dto: CreateSemesterDto) {
    return this.semestersService.create(dto);
  }

  @Get(':id')
  async getSemesterById(@Param('id') id: string) {
    return this.semestersService.getOneOrThrow({
      where: { id: id },
    });
  }

  @Patch(':id')
  async updateCourse(@Param('id') id: string, @Body() dto: UpdateSemesterDto) {
    return this.semestersService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<void> {
    return this.semestersService.delete(id);
  }
}
