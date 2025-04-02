import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { SemestersService } from './semesters.service';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/shared/guards/jwt-auth.guard';
import { RolesGuard } from 'src/shared/guards/roles.guard';
import { Roles } from 'src/shared/decorators/roles.decorator';
import { Role } from 'src/shared/constants';
import { GetSemestersDto } from './dto/get-semester.dto';
import { CreateSemesterDto } from './dto/create-semester.dto';
import { UpdateSemesterDto } from './dto/update-semester.dto';
import { GenerateAcademicCalendarDto } from './dto/generate-academic-calendar.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('Semesters')
@ApiBearerAuth()
@Controller({ path: 'semesters', version: '1' })
export class SemestersController {
  constructor(private readonly semestersService: SemestersService) {}

  @Get()
  @ApiOperation({ summary: 'Get all semesters with filtering and pagination' })
  @ApiResponse({
    status: 200,
    description: 'Returns paginated list of semesters',
  })
  async getSemesters(@Query() dto: GetSemestersDto) {
    return this.semestersService.getSemesters(dto);
  }

  @Post()
  @Roles(Role.Admin)
  @ApiOperation({ summary: 'Create a new semester' })
  @ApiResponse({
    status: 201,
    description: 'The semester has been successfully created',
  })
  async createSemester(@Body() dto: CreateSemesterDto) {
    return this.semestersService.create(dto);
  }

  @Get('current')
  @ApiOperation({ summary: 'Get the current active semester' })
  @ApiResponse({
    status: 200,
    description: 'Returns the current active semester',
  })
  async getCurrentSemester() {
    return this.semestersService.getCurrentSemester();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a semester by ID' })
  @ApiResponse({
    status: 200,
    description: 'Returns the semester with the specified ID',
  })
  async getSemesterById(@Param('id') id: string) {
    return this.semestersService.getOneOrThrow({
      where: { id },
      relations: ['classes', 'courses'],
    });
  }

  @Patch(':id')
  @Roles(Role.Admin)
  @ApiOperation({ summary: 'Update a semester' })
  @ApiResponse({
    status: 200,
    description: 'The semester has been successfully updated',
  })
  async updateSemester(
    @Param('id') id: string,
    @Body() dto: UpdateSemesterDto,
  ) {
    return this.semestersService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.Admin)
  @ApiOperation({ summary: 'Delete a semester' })
  @ApiResponse({
    status: 200,
    description: 'The semester has been successfully deleted',
  })
  async removeSemester(@Param('id') id: string) {
    return this.semestersService.delete(id);
  }

  @Post('generate-calendar')
  @Roles(Role.Admin)
  @ApiOperation({
    summary: 'Generate academic calendar with multiple semesters',
  })
  @ApiResponse({
    status: 201,
    description: 'The academic calendar has been successfully generated',
  })
  async generateAcademicCalendar(@Body() dto: GenerateAcademicCalendarDto) {
    return this.semestersService.generateAcademicCalendar(dto);
  }

  @Post('update-statuses')
  @Roles(Role.Admin)
  @ApiOperation({ summary: 'Update statuses of all semesters based on date' })
  @ApiResponse({
    status: 200,
    description: 'Semester statuses have been updated',
  })
  async updateSemesterStatuses() {
    await this.semestersService.updateSemesterStatuses();
    return { message: 'Semester statuses updated successfully' };
  }

  @Put(':id/courses')
  @Roles(Role.Admin)
  @ApiOperation({ summary: 'Assign courses to a semester' })
  @ApiResponse({
    status: 200,
    description: 'Courses have been assigned to the semester',
  })
  async assignCourses(
    @Param('id') id: string,
    @Body() data: { courseIds: string[] },
  ) {
    return this.semestersService.assignCourses(id, data.courseIds);
  }
}
