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
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/shared/guards/jwt-auth.guard';
import { CreateParentDto } from './dto/create-parent.dto';
import { GetParentsDto } from './dto/get-parents.dto';
import { UpdateParentDto } from './dto/update-parent.dto';
import { ParentsService } from './parents.service';

@ApiTags('parents')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('parents')
export class ParentsController {
  constructor(private readonly parentsService: ParentsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new parent' })
  async createParent(@Body() createParentDto: CreateParentDto) {
    return this.parentsService.create(createParentDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all parents' })
  async getParents(@Query() getParentsDto: GetParentsDto) {
    return this.parentsService.getParents(getParentsDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a parent by id' })
  async getParentById(@Param('id') id: string) {
    return this.parentsService.getParentById(id);
  }

  @Get(':id/children')
  @ApiOperation({ summary: 'Get all children of a parent' })
  async getChildrenByParentId(@Param('id') id: string) {
    return this.parentsService.getChildrenByParentId(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a parent' })
  async updateParent(
    @Param('id') id: string,
    @Body() updateParentDto: UpdateParentDto,
  ) {
    return this.parentsService.update(id, updateParentDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a parent' })
  async deleteParent(@Param('id') id: string): Promise<void> {
    return this.parentsService.delete(id);
  }
}
