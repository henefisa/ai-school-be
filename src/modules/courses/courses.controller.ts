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
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CoursesService } from './courses.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { GetCoursesDto } from './dto/get-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { JwtAuthGuard } from 'src/shared/guards/jwt-auth.guard';

@Controller('courses')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@ApiTags('Courses')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Post()
  async createCourse(@Body() dto: CreateCourseDto) {
    return this.coursesService.create(dto);
  }

  @Get()
  async getCourse(@Query() dto: GetCoursesDto) {
    return this.coursesService.getCourses(dto);
  }

  @Get(':id')
  async getCourseById(@Param('id') id: string) {
    return this.coursesService.getOneOrThrow({ where: { id: id } });
  }

  @Patch(':id')
  async updateCourse(@Param('id') id: string, @Body() dto: UpdateCourseDto) {
    return this.coursesService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<void> {
    return this.coursesService.delete(id);
  }
}
