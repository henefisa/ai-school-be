import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClassRoom } from 'src/typeorm/entities/class.entity';
import { ClassesService } from './classes.service';
import { CoursesModule } from '../courses/courses.module';
import { ClassesController } from './classes.controller';
import { ClassAssignment } from 'src/typeorm/entities/class-assignment.entity';
import { Enrollment } from 'src/typeorm/entities/enrollment.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([ClassRoom, ClassAssignment, Enrollment]),
    CoursesModule,
  ],
  controllers: [ClassesController],
  providers: [ClassesService],
  exports: [ClassesService],
})
export class ClassesModule {}
