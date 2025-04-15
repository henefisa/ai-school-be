import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AttendancesService } from './attendances.service';
import { CreateAttendanceDto } from './dto/create-attendance.dto';
import { UpdateAttendanceDto } from './dto/update-attendance.dto';
import { GetAttendancesDto } from './dto/get-attendances.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { Attendance } from 'src/typeorm/entities/attendance.entity';
import { Auth } from 'src/shared/decorators/auth.decorator';
import { Role } from 'src/shared/constants';

@ApiTags('Attendances')
@Controller('attendances')
@Auth([Role.Admin, Role.Teacher]) // Secure endpoints, adjust roles as needed
export class AttendancesController {
  constructor(private readonly attendancesService: AttendancesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new attendance record' })
  @ApiResponse({
    status: 201,
    description: 'The attendance record has been successfully created.',
    type: Attendance,
  })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  @ApiResponse({ status: 404, description: 'Enrollment not found.' })
  @ApiBody({ type: CreateAttendanceDto })
  create(
    @Body() createAttendanceDto: CreateAttendanceDto,
  ): Promise<Attendance> {
    return this.attendancesService.create(createAttendanceDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get a list of attendance records' })
  @ApiResponse({
    status: 200,
    description: 'List of attendance records retrieved successfully.',
    type: [Attendance], // Note: Swagger might need a paginated response DTO here
  })
  @ApiQuery({ type: GetAttendancesDto }) // Use DTO for query parameters
  findAll(
    @Query() getAttendancesDto: GetAttendancesDto,
  ): Promise<{ results: Attendance[]; count: number }> {
    return this.attendancesService.findAll(getAttendancesDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single attendance record by ID' })
  @ApiResponse({
    status: 200,
    description: 'Attendance record retrieved successfully.',
    type: Attendance,
  })
  @ApiResponse({ status: 404, description: 'Attendance record not found.' })
  @ApiParam({ name: 'id', description: 'Attendance record ID (UUID)' })
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Attendance> {
    return this.attendancesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an attendance record by ID' })
  @ApiResponse({
    status: 200,
    description: 'Attendance record updated successfully.',
    type: Attendance,
  })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  @ApiResponse({ status: 404, description: 'Attendance record not found.' })
  @ApiParam({ name: 'id', description: 'Attendance record ID (UUID)' })
  @ApiBody({ type: UpdateAttendanceDto })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateAttendanceDto: UpdateAttendanceDto,
  ): Promise<Attendance> {
    return this.attendancesService.update(id, updateAttendanceDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an attendance record by ID' })
  @ApiResponse({
    status: 204,
    description: 'Attendance record deleted successfully.',
  })
  @ApiResponse({ status: 404, description: 'Attendance record not found.' })
  @ApiParam({ name: 'id', description: 'Attendance record ID (UUID)' })
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.attendancesService.remove(id);
  }
}
