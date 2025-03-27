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
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/shared/guards/jwt-auth.guard';
import { ClassesService } from './classes.service';
import { CreateClassDto } from './dto/create-class.dto';
import { GetClassesDto } from './dto/get-classes.dto';

@Controller('classes')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@ApiTags('Classes')
export class ClassesController {
  constructor(private readonly classesService: ClassesService) {}

  @Post()
  async createClasses(@Body() dto: CreateClassDto) {
    return this.classesService.create(dto);
  }

  @Get()
  async getClasses(@Query() dto: GetClassesDto) {
    return this.classesService.findAll(dto);
  }
}
