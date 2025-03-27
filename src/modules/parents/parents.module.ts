import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Parent } from 'src/typeorm/entities/parent.entity';
import { ParentsController } from './parents.controller';
import { ParentsService } from './parents.service';
import { Student } from 'src/typeorm/entities/student.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Parent, Student])],
  controllers: [ParentsController],
  providers: [ParentsService],
  exports: [ParentsService],
})
export class ParentsModule {}
