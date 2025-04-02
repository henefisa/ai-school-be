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
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/shared/guards/jwt-auth.guard';
import { DayOfWeek } from 'src/shared/constants';
import { Roles } from 'src/shared/decorators/roles.decorator';
import { Role } from 'src/shared/constants';
import { RolesGuard } from 'src/shared/guards/roles.guard';
import { CreateRoomDto } from './dto/create-room.dto';
import { GetRoomsDto } from './dto/get-rooms.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { RoomsService } from './rooms.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('rooms')
@ApiBearerAuth()
@ApiTags('Rooms')
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @Post()
  @Roles(Role.Admin)
  @ApiOperation({ summary: 'Create a new room' })
  @ApiResponse({
    status: 201,
    description: 'Room has been successfully created',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  createRoom(@Body() dto: CreateRoomDto) {
    return this.roomsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get rooms with optional filtering' })
  @ApiResponse({ status: 200, description: 'List of rooms' })
  getRooms(@Query() dto: GetRoomsDto) {
    return this.roomsService.getRooms(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a room by ID' })
  @ApiParam({ name: 'id', description: 'Room ID', type: 'string' })
  @ApiResponse({ status: 200, description: 'Room found' })
  @ApiResponse({ status: 404, description: 'Room not found' })
  getRoomById(@Param('id') id: string) {
    return this.roomsService.getOneOrThrow({
      where: { id },
    });
  }

  @Get(':id/schedule')
  @ApiOperation({ summary: "Get a room's schedule" })
  @ApiParam({ name: 'id', description: 'Room ID', type: 'string' })
  @ApiResponse({ status: 200, description: 'Room schedule retrieved' })
  @ApiResponse({ status: 404, description: 'Room not found' })
  getRoomSchedule(@Param('id') id: string) {
    return this.roomsService.getRoomSchedule(id);
  }

  @Get('check-availability/:id')
  @ApiOperation({
    summary: 'Check if a room is available for a specific time slot',
  })
  @ApiParam({ name: 'id', description: 'Room ID', type: 'string' })
  @ApiResponse({ status: 200, description: 'Availability check completed' })
  @ApiResponse({ status: 404, description: 'Room not found' })
  checkRoomAvailability(
    @Param('id') id: string,
    @Query('dayOfWeek') dayOfWeek: DayOfWeek,
    @Query('startTime') startTime: string,
    @Query('endTime') endTime: string,
    @Query('excludeClassId') excludeClassId?: string,
  ) {
    return this.roomsService.isRoomAvailable(
      id,
      dayOfWeek,
      new Date(startTime),
      new Date(endTime),
      excludeClassId,
    );
  }

  @Get('analytics/utilization')
  @Roles(Role.Admin)
  @ApiOperation({ summary: 'Get room utilization analytics' })
  @ApiResponse({ status: 200, description: 'Analytics retrieved' })
  getRoomUtilizationAnalytics() {
    return this.roomsService.getRoomUtilizationAnalytics();
  }

  @Patch(':id')
  @Roles(Role.Admin)
  @ApiOperation({ summary: 'Update a room' })
  @ApiParam({ name: 'id', description: 'Room ID', type: 'string' })
  @ApiResponse({ status: 200, description: 'Room updated' })
  @ApiResponse({ status: 404, description: 'Room not found' })
  updateRooms(@Param('id') id: string, @Body() dto: UpdateRoomDto) {
    return this.roomsService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.Admin)
  @ApiOperation({ summary: 'Delete a room' })
  @ApiParam({ name: 'id', description: 'Room ID', type: 'string' })
  @ApiResponse({ status: 200, description: 'Room deleted' })
  @ApiResponse({ status: 404, description: 'Room not found' })
  @ApiResponse({ status: 400, description: 'Room is in use by classes' })
  remove(@Param('id') id: string) {
    return this.roomsService.delete(id);
  }
}
