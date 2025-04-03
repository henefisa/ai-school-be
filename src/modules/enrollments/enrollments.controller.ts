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
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { EnrollmentsService } from './enrollments.service';
import { GetEnrollmentsDto } from './dto/get-enrollments.dto';
import { JwtAuthGuard } from 'src/shared/guards/jwt-auth.guard';
import { Roles } from 'src/shared/decorators/roles.decorator';
import { Role } from 'src/shared/constants';
import { RolesGuard } from 'src/shared/guards/roles.guard';
import { Request } from 'express';
import { RegisterEnrollmentDto } from './dto/register-enrollment.dto';
import { UpdateEnrollmentDto } from './dto/update-enrollment.dto';
import { DropEnrollmentDto } from './dto/drop-enrollment.dto';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@UseGuards(JwtAuthGuard)
@ApiTags('Enrollments')
@Controller({ path: 'enrollments', version: '1' })
export class EnrollmentsController {
  constructor(private readonly enrollmentsService: EnrollmentsService) {}

  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get enrollments with filtering and pagination' })
  @ApiResponse({
    status: 200,
    description: 'Returns list of enrollments with pagination metadata',
  })
  async getEnrolments(@Query() dto: GetEnrollmentsDto, @Req() req: Request) {
    // Filter by student ID for student users
    if (req.user.role === Role.Student && req.user.studentId) {
      dto.studentId = req.user.studentId;
    }

    return this.enrollmentsService.getEnrollments(dto);
  }

  @Get(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get enrollment by ID' })
  @ApiResponse({
    status: 200,
    description: 'Returns enrollment details',
  })
  @ApiResponse({
    status: 404,
    description: 'Enrollment not found',
  })
  async getEnrollment(@Param('id') id: string, @Req() req: Request) {
    // Check if requesting user is the student or admin
    const enrollment = await this.enrollmentsService.getEnrollmentById(id);
    if (
      req.user.role === Role.Student &&
      req.user.studentId !== enrollment.studentId
    ) {
      // Only return the enrollment if it belongs to the requesting student
      return {
        id: enrollment.id,
        status: enrollment.status,
        classId: enrollment.classId,
        enrollmentDate: enrollment.enrollmentDate,
      };
    }

    return enrollment;
  }

  @Post()
  @Roles(Role.Student, Role.Admin)
  @UseGuards(RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Register for a class' })
  @ApiResponse({
    status: 201,
    description: 'Student successfully enrolled in class',
  })
  @ApiResponse({
    status: 400,
    description:
      'Bad request - class full, already enrolled, or prerequisites not met',
  })
  async register(@Req() req: Request, @Body() dto: RegisterEnrollmentDto) {
    // For student role, use their own ID
    // For admin role, studentId could be specified in the DTO
    const studentId = req.user.studentId;

    // If user is not a student (admin), they cannot register
    if (!studentId) {
      throw new Error('Only students can register for classes');
    }

    return this.enrollmentsService.register(studentId, dto);
  }

  @Patch(':id')
  @Roles(Role.Student, Role.Admin)
  @UseGuards(RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update enrollment details' })
  @ApiResponse({
    status: 200,
    description: 'Enrollment updated successfully',
  })
  async updateEnrollment(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: UpdateEnrollmentDto,
  ) {
    const studentId = req.user.studentId;

    // Admin can update any enrollment
    if (req.user.role === Role.Admin) {
      // Get enrollment first to know the student ID
      const enrollment = await this.enrollmentsService.getEnrollmentById(id);
      return this.enrollmentsService.update(id, enrollment.studentId, dto);
    }

    // Students can only update their own enrollments
    return this.enrollmentsService.update(id, studentId, dto);
  }

  @Post(':id/drop')
  @Roles(Role.Student)
  @UseGuards(RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Drop a class' })
  @HttpCode(HttpStatus.OK)
  @ApiResponse({
    status: 200,
    description: 'Class dropped successfully',
  })
  async dropClass(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: DropEnrollmentDto,
  ) {
    const studentId = req.user.studentId;
    return this.enrollmentsService.dropClass(id, studentId, dto);
  }

  @Delete(':id')
  @Roles(Role.Admin)
  @UseGuards(RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete an enrollment (admin only)' })
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiResponse({
    status: 204,
    description: 'Enrollment deleted successfully',
  })
  async delete(@Param('id') id: string) {
    return this.enrollmentsService.delete(id);
  }
}
