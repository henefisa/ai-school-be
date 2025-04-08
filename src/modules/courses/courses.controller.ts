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
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CoursesService } from './courses.service';
import { CreateCourseDto } from './dto/create-course.dto';
import {
  GetCoursesByDepartmentDto,
  GetCoursesDto,
} from './dto/get-courses.dto';
import { GetCourseDto } from './dto/get-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { JwtAuthGuard } from 'src/shared/guards/jwt-auth.guard';
import { RolesGuard } from 'src/shared/guards/roles.guard';
import { Roles } from 'src/shared/decorators/roles.decorator';
import { Role } from 'src/shared/constants';

@Controller('courses')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
@ApiTags('Courses')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Post()
  @Roles(Role.Admin)
  @ApiOperation({ summary: 'Create a new course' })
  @ApiResponse({
    status: 201,
    description: 'The course has been successfully created.',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data.',
  })
  async createCourse(@Body() dto: CreateCourseDto) {
    return this.coursesService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all courses with pagination and filtering' })
  @ApiResponse({
    status: 200,
    description: 'Returns a list of courses.',
  })
  async getCourses(@Query() dto: GetCoursesDto) {
    return this.coursesService.getCourses(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get course by ID' })
  @ApiResponse({
    status: 200,
    description: 'Returns the course information.',
  })
  @ApiResponse({
    status: 404,
    description: 'Course not found.',
  })
  async getCourseById(@Param('id') id: string, @Query() dto: GetCourseDto) {
    return this.coursesService.getCourseById(id, dto);
  }

  @Get('department/:departmentId')
  @ApiOperation({ summary: 'Get courses by department ID' })
  @ApiResponse({
    status: 200,
    description: 'Returns courses within the specified department.',
  })
  @ApiResponse({
    status: 404,
    description: 'Department not found.',
  })
  async getCoursesByDepartment(
    @Param('departmentId') departmentId: string,
    @Query() dto: GetCoursesByDepartmentDto,
  ) {
    return this.coursesService.getDepartmentCourses(departmentId, dto);
  }

  @Patch(':id')
  @Roles(Role.Admin)
  @ApiOperation({ summary: 'Update course information' })
  @ApiResponse({
    status: 200,
    description: 'The course has been successfully updated.',
  })
  @ApiResponse({
    status: 404,
    description: 'Course not found.',
  })
  async updateCourse(@Param('id') id: string, @Body() dto: UpdateCourseDto) {
    return this.coursesService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.Admin)
  @ApiOperation({ summary: 'Delete a course' })
  @ApiResponse({
    status: 200,
    description: 'The course has been successfully deleted.',
  })
  @ApiResponse({
    status: 400,
    description: 'Cannot delete course with associated classes.',
  })
  @ApiResponse({
    status: 404,
    description: 'Course not found.',
  })
  remove(@Param('id') id: string) {
    return this.coursesService.delete(id);
  }
}
