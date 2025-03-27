import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { EnrollmentsService } from './enrollments.service';
import { GetEnrollmentsDto } from './dto/get-enrollment.dto';
import { JwtAuthGuard } from 'src/shared/guards/jwt-auth.guard';
import { Roles } from 'src/shared/decorators/roles.decorator';
import { Role } from 'src/shared/constants';
import { RoleGuard } from 'src/shared/guards/roles.guard';
import { Request } from 'express';
import { RegisterEnrollmentDto } from './dto/register-enrollment.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@UseGuards(JwtAuthGuard)
@ApiTags('Enrollments')
@Controller({ path: 'enrollments', version: '1' })
export class EnrollmentsController {
  constructor(private readonly enrollmentsService: EnrollmentsService) {}

  @Get()
  @ApiBearerAuth()
  async getEnrolments(@Query() dto: GetEnrollmentsDto) {
    return this.enrollmentsService.getEnrollments(dto);
  }

  @Post()
  @Roles(Role.Student)
  @UseGuards(RoleGuard)
  @ApiBearerAuth()
  async register(@Req() req: Request, @Body() dto: RegisterEnrollmentDto) {
    const studentId = req.user.studentId;
    return this.enrollmentsService.register(studentId, dto);
  }

  @Delete(':id')
  @Roles(Role.Student)
  @UseGuards(RoleGuard)
  @ApiBearerAuth()
  async delete(@Req() req: Request, @Param('id') id: string) {
    const studentId = req.user.studentId;
    return this.enrollmentsService.delete(studentId, id);
  }
}
