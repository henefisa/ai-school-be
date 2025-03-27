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
import { StudentsService } from './students.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { GetStudentsDto } from './dto/get-students.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/shared/guards/jwt-auth.guard';

@Controller({ path: 'students', version: '1' })
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@ApiTags('Students')
export class StudentsController {
  constructor(private readonly studentService: StudentsService) {}

  @Post()
  async createStudent(@Body() createStudentDto: CreateStudentDto) {
    return this.studentService.create(createStudentDto);
  }

  @Get()
  async getStudents(@Query() getStudentsDto: GetStudentsDto) {
    return this.studentService.getStudents(getStudentsDto);
  }

  @Get(':id')
  async getStudentById(@Param('id') id: string) {
    return this.studentService.getOneOrThrow({ where: { id: id } });
  }

  @Patch(':id')
  async updateStudent(@Param('id') id: string, @Body() dto: UpdateStudentDto) {
    return this.studentService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<void> {
    return this.studentService.delete(id);
  }
}
