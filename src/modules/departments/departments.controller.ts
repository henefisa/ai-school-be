import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { DepartmentsService } from './departments.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { GetDepartmentsDto } from './dto/get-departments.dto';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { GetDepartmentDto } from './dto/get-department.dto';
import { JwtAuthGuard } from 'src/shared/guards/jwt-auth.guard';
import { RolesGuard } from 'src/shared/guards/roles.guard';
import { Roles } from 'src/shared/decorators/roles.decorator';
import { Role } from 'src/shared/constants';

@Controller({ path: 'departments', version: '1' })
@ApiTags('departments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DepartmentsController {
  constructor(private readonly departmentsService: DepartmentsService) {}

  /**
   * Create a new department
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles(Role.Admin)
  @ApiOperation({ summary: 'Create a new department' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Department created successfully',
  })
  create(@Body() dto: CreateDepartmentDto) {
    return this.departmentsService.create(dto);
  }

  /**
   * Get all departments with pagination and filtering
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all departments' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns all departments',
  })
  findAll(@Query() dto: GetDepartmentsDto) {
    return this.departmentsService.findAll(dto);
  }

  /**
   * Get a department by ID
   */
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a department by ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Returns the department' })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Department not found',
  })
  findOne(@Param('id') id: string, @Query() dto: GetDepartmentDto) {
    return this.departmentsService.findOne({ ...dto, id });
  }

  /**
   * Update a department
   */
  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @Roles(Role.Admin)
  @ApiOperation({ summary: 'Update a department' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Department updated successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Department not found',
  })
  update(@Param('id') id: string, @Body() dto: UpdateDepartmentDto) {
    return this.departmentsService.update(id, dto);
  }

  /**
   * Delete a department
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(Role.Admin)
  @ApiOperation({ summary: 'Delete a department' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Department deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Department not found',
  })
  remove(@Param('id') id: string) {
    return this.departmentsService.remove(id);
  }

  /**
   * Set department head
   */
  @Patch(':id/head/:teacherId')
  @HttpCode(HttpStatus.OK)
  @Roles(Role.Admin)
  @ApiOperation({ summary: 'Set department head' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Department head set successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Department or teacher not found',
  })
  setDepartmentHead(
    @Param('id') departmentId: string,
    @Param('teacherId') teacherId: string,
  ) {
    return this.departmentsService.setDepartmentHead(departmentId, teacherId);
  }

  /**
   * Get all teachers in a department
   */
  @Get(':id/teachers')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all teachers in a department' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns all teachers in the department',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Department not found',
  })
  getDepartmentTeachers(@Param('id') departmentId: string) {
    return this.departmentsService.getDepartmentTeachers(departmentId);
  }

  /**
   * Assign a teacher to a department
   */
  @Post(':id/teachers/:teacherId')
  @HttpCode(HttpStatus.OK)
  @Roles(Role.Admin)
  @ApiOperation({ summary: 'Assign a teacher to a department' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Teacher assigned successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Department or teacher not found',
  })
  assignTeacher(
    @Param('id') departmentId: string,
    @Param('teacherId') teacherId: string,
  ) {
    return this.departmentsService.assignTeacher(departmentId, teacherId);
  }

  /**
   * Remove a teacher from a department
   */
  @Delete(':id/teachers/:teacherId')
  @HttpCode(HttpStatus.OK)
  @Roles(Role.Admin)
  @ApiOperation({ summary: 'Remove a teacher from a department' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Teacher removed successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Department or teacher not found',
  })
  removeTeacher(
    @Param('id') departmentId: string,
    @Param('teacherId') teacherId: string,
  ) {
    return this.departmentsService.removeTeacher(departmentId, teacherId);
  }
}
