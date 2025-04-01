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
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/shared/guards/jwt-auth.guard';
import { ClassesService } from './classes.service';
import { CreateClassDto } from './dto/create-class.dto';
import { GetClassesDto } from './dto/get-classes.dto';
import { Roles } from 'src/shared/decorators/roles.decorator';
import { Role } from 'src/shared/constants';
import { RolesGuard } from 'src/shared/guards/roles.guard';
import { EnrollStudentDto } from './dto/enroll-student.dto';
import { AssignTeacherDto } from './dto/assign-teacher.dto';

@Controller('classes')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
@ApiTags('Classes')
export class ClassesController {
  constructor(private readonly classesService: ClassesService) {}

  @Post()
  @Roles(Role.Admin)
  @ApiOperation({ summary: 'Create a new class' })
  @ApiResponse({
    status: 201,
    description: 'The class has been successfully created',
  })
  async createClass(@Body() dto: CreateClassDto) {
    return this.classesService.create(dto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get a paginated list of classes with filtering options',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns a paginated list of classes',
  })
  async getClasses(@Query() dto: GetClassesDto) {
    return this.classesService.findAll(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get detailed information about a specific class' })
  @ApiParam({ name: 'id', description: 'Class ID' })
  @ApiResponse({
    status: 200,
    description: 'Returns the detailed class information',
  })
  async getClassDetails(@Param('id') id: string) {
    return this.classesService.getClassDetails(id);
  }

  @Patch(':id')
  @Roles(Role.Admin)
  @ApiOperation({ summary: 'Update a class' })
  @ApiParam({ name: 'id', description: 'Class ID' })
  @ApiResponse({
    status: 200,
    description: 'The class has been successfully updated',
  })
  async updateClass(
    @Param('id') id: string,
    @Body() dto: Partial<CreateClassDto>,
  ) {
    return this.classesService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.Admin)
  @ApiOperation({ summary: 'Delete a class' })
  @ApiParam({ name: 'id', description: 'Class ID' })
  @ApiResponse({
    status: 200,
    description: 'The class has been successfully deleted',
  })
  async deleteClass(@Param('id') id: string) {
    return this.classesService.delete(id);
  }

  // Teacher assignment endpoints
  @Post(':id/teachers')
  @Roles(Role.Admin)
  @ApiOperation({ summary: 'Assign a teacher to a class' })
  @ApiParam({ name: 'id', description: 'Class ID' })
  @ApiResponse({
    status: 201,
    description: 'The teacher has been successfully assigned to the class',
  })
  async assignTeacherToClass(
    @Param('id') id: string,
    @Body() dto: AssignTeacherDto,
  ) {
    return this.classesService.assignTeacher(id, dto);
  }

  @Delete(':id/teachers/:teacherId')
  @Roles(Role.Admin)
  @ApiOperation({ summary: 'Remove a teacher from a class' })
  @ApiParam({ name: 'id', description: 'Class ID' })
  @ApiParam({ name: 'teacherId', description: 'Teacher ID' })
  @ApiResponse({
    status: 200,
    description: 'The teacher has been successfully removed from the class',
  })
  async removeTeacherFromClass(
    @Param('id') id: string,
    @Param('teacherId') teacherId: string,
  ) {
    return this.classesService.removeTeacher(id, teacherId);
  }

  @Get(':id/teachers')
  @ApiOperation({ summary: 'Get all teachers assigned to a class' })
  @ApiParam({ name: 'id', description: 'Class ID' })
  @ApiResponse({
    status: 200,
    description: 'Returns a list of teachers assigned to the class',
  })
  async getClassTeachers(@Param('id') id: string) {
    return this.classesService.getClassTeachers(id);
  }

  // Student enrollment endpoints
  @Post(':id/students')
  @Roles(Role.Admin, Role.Teacher)
  @ApiOperation({ summary: 'Enroll a student in a class' })
  @ApiParam({ name: 'id', description: 'Class ID' })
  @ApiResponse({
    status: 201,
    description: 'The student has been successfully enrolled in the class',
  })
  async enrollStudentInClass(
    @Param('id') id: string,
    @Body() dto: EnrollStudentDto,
  ) {
    return this.classesService.enrollStudent(id, dto);
  }

  @Delete(':id/students/:studentId')
  @Roles(Role.Admin, Role.Teacher)
  @ApiOperation({ summary: 'Remove a student from a class' })
  @ApiParam({ name: 'id', description: 'Class ID' })
  @ApiParam({ name: 'studentId', description: 'Student ID' })
  @ApiResponse({
    status: 200,
    description: 'The student has been successfully removed from the class',
  })
  async removeStudentFromClass(
    @Param('id') id: string,
    @Param('studentId') studentId: string,
  ) {
    return this.classesService.removeStudentEnrollment(id, studentId);
  }

  @Get(':id/students')
  @ApiOperation({ summary: 'Get all students enrolled in a class' })
  @ApiParam({ name: 'id', description: 'Class ID' })
  @ApiResponse({
    status: 200,
    description: 'Returns a list of students enrolled in the class',
  })
  async getEnrolledStudents(@Param('id') id: string) {
    return this.classesService.getEnrolledStudents(id);
  }
}
