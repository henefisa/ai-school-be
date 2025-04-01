import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClassAssignment } from 'src/typeorm/entities/class-assignment.entity';
import { Course } from 'src/typeorm/entities/course.entity';
import { Department } from 'src/typeorm/entities/department.entity';
import { CoursesController } from './courses.controller';
import { CoursesService } from './courses.service';
import { ClassRoom } from 'src/typeorm/entities/class.entity';
import { DepartmentsModule } from 'src/modules/departments/departments.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Course, Department, ClassAssignment, ClassRoom]),
    DepartmentsModule,
  ],
  controllers: [CoursesController],
  providers: [CoursesService],
  exports: [CoursesService],
})
export class CoursesModule {}
