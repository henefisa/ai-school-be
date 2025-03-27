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
import { RoomsService } from './rooms.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { GetRoomsDto } from './dto/get-rooms.dto';
import { UpdateRoomDto } from './dto/update-room.dto';

@Controller('rooms')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@ApiTags('Rooms')
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @Post()
  async createRoom(@Body() dto: CreateRoomDto) {
    return this.roomsService.create(dto);
  }

  @Get()
  async getRoom(@Query() dto: GetRoomsDto) {
    return this.roomsService.getRooms(dto);
  }

  @Get(':id')
  async getRoomById(@Param('id') id: string) {
    return this.roomsService.getOneOrThrow({ where: { id: id } });
  }

  @Patch(':id')
  async updateRooms(@Param('id') id: string, @Body() dto: UpdateRoomDto) {
    return this.roomsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<void> {
    return this.roomsService.delete(id);
  }
}
