import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Attendance } from 'src/typeorm/entities/attendance.entity';
import { AttendancesService } from './attendances.service';
import { AttendancesController } from './attendances.controller';
import { EnrollmentsModule } from '../enrollments/enrollments.module'; // Import EnrollmentsModule

@Module({
  imports: [
    TypeOrmModule.forFeature([Attendance]),
    EnrollmentsModule, // Import EnrollmentsModule to use EnrollmentsService
  ],
  controllers: [AttendancesController],
  providers: [AttendancesService],
  exports: [AttendancesService], // Export service if needed by other modules
})
export class AttendancesModule {}
