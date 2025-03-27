import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './modules/auth/auth.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import { HttpMiddleware } from './shared/middlewares/http.middleware';
import { UsersModule } from './modules/users/users.module';
import { User } from './typeorm/entities/user.entity';
import { Student } from './typeorm/entities/student.entity';
import { Teacher } from './typeorm/entities/teacher.entity';
import { Department } from './typeorm/entities/department.entity';
import { ClassAssignment } from './typeorm/entities/class-assignment.entity';
import { Course } from './typeorm/entities/course.entity';
import { StudentAddress } from './typeorm/entities/student-address.entity';
import { ParentAddress } from './typeorm/entities/parent-address.entity';
import { Parent } from './typeorm/entities/parent.entity';
import { Address } from './typeorm/entities/address.entity';
import { ClassRoom } from './typeorm/entities/class.entity';
import { Enrollment } from './typeorm/entities/enrollment.entity';
import { Semester } from './typeorm/entities/semester.entity';
import { Room } from './typeorm/entities/room.entity';
import { Attendance } from './typeorm/entities/attendance.entity';
import { Grade } from './typeorm/entities/grade.entity';
import { StudentsModule } from './modules/students/students.module';
import { TeachersModule } from './modules/teachers/teachers.module';
import { EnrollmentsModule } from './modules/enrollments/enrollments.module';
import { CoursesModule } from './modules/courses/courses.module';
import { DepartmentsModule } from './modules/departments/departments.module';
import { ClassesModule } from './modules/classes/classes.module';
import { SemestersModule } from './modules/semesters/semesters.module';
import { RoomsModule } from './modules/rooms/rooms.module';
import { ParentsModule } from './modules/parents/parents.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST'),
        port: configService.get('DB_PORT'),
        username: configService.get('DB_USERNAME'),
        password: configService.get('DB_PASSWORD'),
        namingStrategy: new SnakeNamingStrategy(),
        database: configService.get('DB_DATABASE'),
        entities: [
          User,
          Student,
          Teacher,
          Department,
          ClassAssignment,
          Course,
          StudentAddress,
          ParentAddress,
          Address,
          Parent,
          ClassRoom,
          Enrollment,
          Semester,
          Room,
          Attendance,
          Grade,
        ],
        autoLoadEntities: true,
        synchronize: configService.get('NODE_ENV') !== 'production',
      }),
    }),
    UsersModule,
    AuthModule,
    StudentsModule,
    TeachersModule,
    CoursesModule,
    EnrollmentsModule,
    DepartmentsModule,
    ClassesModule,
    RoomsModule,
    SemestersModule,
    ParentsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(HttpMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
