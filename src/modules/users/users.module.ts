import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/typeorm/entities/user.entity';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { Student } from 'src/typeorm/entities/student.entity';
import { Parent } from 'src/typeorm/entities/parent.entity';
import { Teacher } from 'src/typeorm/entities/teacher.entity';
import { Department } from 'src/typeorm/entities/department.entity';
import { ParentAddress } from 'src/typeorm/entities/parent-address.entity';
import { Course } from 'src/typeorm/entities/course.entity';
import { Address } from 'src/typeorm/entities/address.entity';
import { StudentAddress } from 'src/typeorm/entities/student-address.entity';
import { Enrollment } from 'src/typeorm/entities/enrollment.entity';
import { Semester } from 'src/typeorm/entities/semester.entity';
import { ClassRoom } from 'src/typeorm/entities/class.entity';
import { ClassAssignment } from 'src/typeorm/entities/class-assignment.entity';
import { Grade } from 'src/typeorm/entities/grade.entity';
import { Attendance } from 'src/typeorm/entities/attendance.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Student,
      Parent,
      Teacher,
      Department,
      ParentAddress,
      Course,
      Address,
      StudentAddress,
      Enrollment,
      Semester,
      ClassRoom,
      ClassAssignment,
      Grade,
      Attendance,
    ]),
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
