import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { StudentsService } from './students.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { GetStudentsDto } from './dto/get-students.dto';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/shared/guards/jwt-auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';

@ApiTags('students')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('students')
export class StudentsController {
  constructor(private readonly studentService: StudentsService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a new student from form data',
    description: `
      To create a student with multipart/form-data, use form fields with prefix notation:
      - personal.firstName: John
      - personal.lastName: Doe
      - contact.email: john.doe@example.com
      
      All fields should be sent as form fields, not as JSON.
      The photo should be sent as a file in the form data.
    `,
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: CreateStudentDto })
  @UseInterceptors(FileInterceptor('photo'))
  async create(
    @Body() dto: CreateStudentDto,
    @UploadedFile() photo?: Express.Multer.File,
  ) {
    dto.photo = photo;

    return this.studentService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all students' })
  async getStudents(@Query() getStudentsDto: GetStudentsDto) {
    return this.studentService.getStudents(getStudentsDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a student by id' })
  async getStudentById(@Param('id') id: string) {
    return this.studentService.getOneOrThrow({ where: { id } });
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a student' })
  async updateStudent(@Param('id') id: string, @Body() dto: UpdateStudentDto) {
    return this.studentService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a student' })
  remove(@Param('id') id: string): Promise<void> {
    return this.studentService.delete(id);
  }
}
