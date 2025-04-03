import { Module } from '@nestjs/common';
import { EnrollmentsController } from './enrollments.controller';
import { EnrollmentsService } from './enrollments.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Enrollment } from 'src/typeorm/entities/enrollment.entity';
import { ClassRoom } from 'src/typeorm/entities/class.entity';
import { CoursePrerequisite } from 'src/typeorm/entities/course-prerequisite.entity';
import { CoursesModule } from '../courses/courses.module';
import { StudentsModule } from '../students/students.module';
import { ClassesModule } from '../classes/classes.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Enrollment, ClassRoom, CoursePrerequisite]),
    CoursesModule,
    StudentsModule,
    ClassesModule,
  ],
  controllers: [EnrollmentsController],
  providers: [EnrollmentsService],
  exports: [EnrollmentsService],
})
export class EnrollmentsModule {}
