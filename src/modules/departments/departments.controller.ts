import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
} from '@nestjs/common';
import { DepartmentsService } from './departments.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { GetDepartmentDto } from './dto/get-departments.dto';
import { ApiTags } from '@nestjs/swagger';

@Controller({ path: 'departments', version: '1' })
@ApiTags('departments')
export class DepartmentsController {
  constructor(private readonly departmentsService: DepartmentsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateDepartmentDto) {
    return this.departmentsService.create(dto);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  findAll(@Query() dto: GetDepartmentDto) {
    return this.departmentsService.findAll(dto);
  }
}
