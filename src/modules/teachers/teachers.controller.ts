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
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/shared/guards/jwt-auth.guard';
import { TeachersService } from './teachers.service';
import { CreateTeacherDto } from './dto/create-teacher.dto';
import { GetTeachersDto } from './dto/get-teachers.dto';
import { UpdateTeacherDto } from './dto/update-teacher.dto';

@Controller('teachers')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@ApiTags('Teachers')
export class TeachersController {
  constructor(private readonly teacherService: TeachersService) {}

  @Post()
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('personal.photo'))
  async createTeacher(
    @Body() dto: CreateTeacherDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (file) {
      dto['personal.photo'] = file;
    }

    return this.teacherService.create(dto);
  }

  @Get()
  async getTeachers(@Query() dto: GetTeachersDto) {
    return this.teacherService.getTeachers(dto);
  }

  @Get(':id')
  async getTeacherById(@Param('id') id: string) {
    return this.teacherService.getTeacherById(id);
  }

  @Patch(':id')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('personal.photo'))
  async updateTeacher(
    @Param('id') id: string,
    @Body() dto: UpdateTeacherDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (file) {
      dto['personal.photo'] = file;
    }

    return this.teacherService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<void> {
    return this.teacherService.delete(id);
  }
}
