import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  BadRequestException,
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
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/shared/guards/jwt-auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { Roles } from 'src/shared/decorators/roles.decorator';
import { Role } from 'src/shared/constants';
import { Request } from 'express';

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
  @Roles(Role.Admin)
  async create(
    @Body() dto: CreateStudentDto,
    @UploadedFile() photo?: Express.Multer.File,
  ) {
    dto.photo = photo;

    return this.studentService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all students' })
  async getStudents(@Query() dto: GetStudentsDto) {
    return this.studentService.getStudents(dto);
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

  @Patch(':id/photo')
  @ApiOperation({
    summary: 'Update student photo',
    description:
      'Students can update their own photo, admins can update any student photo',
  })
  @ApiParam({ name: 'id', description: 'Student ID' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        photo: {
          type: 'string',
          format: 'binary',
          description: 'Student photo (JPG, JPEG, or PNG)',
        },
      },
    },
  })
  @Roles(Role.Student, Role.Admin)
  @UseInterceptors(
    FileInterceptor('photo', {
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
      },
      fileFilter: (req, file, callback) => {
        // Allow only images
        if (!file.mimetype.match(/^image\/(jpeg|jpg|png)$/)) {
          return callback(
            new BadRequestException(
              'Only JPG, JPEG, and PNG files are allowed',
            ),
            false,
          );
        }
        callback(null, true);
      },
    }),
  )
  async updatePhoto(
    @Param('id') id: string,
    @UploadedFile() photo: Express.Multer.File,
    @Req() req: Request,
  ) {
    // Check if user is updating their own photo or is an admin
    const currentUser = req.user;
    const canUpdateAnyPhoto = currentUser.role === Role.Admin;

    return this.studentService.updatePhoto(
      id,
      photo,
      currentUser.id,
      canUpdateAnyPhoto,
    );
  }
}
