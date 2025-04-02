import { Module } from '@nestjs/common';
import { RoomsService } from './rooms.service';
import { RoomsController } from './rooms.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Room } from 'src/typeorm/entities/room.entity';
import { ClassRoom } from 'src/typeorm/entities/class.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Room, ClassRoom])],
  providers: [RoomsService],
  controllers: [RoomsController],
  exports: [RoomsService],
})
export class RoomsModule {}
