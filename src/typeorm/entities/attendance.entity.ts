import { Column, Entity, ManyToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { AttendanceStatus } from 'src/shared/constants';
import { Enrollment } from './enrollment.entity';

@Entity('attendances')
export class Attendance extends BaseEntity {
  @Column({ nullable: true, type: 'uuid' })
  enrollmentId: string;

  @Column({ nullable: true, type: 'date' })
  attendanceDate: Date;

  @Column({ nullable: true, type: 'enum', enum: AttendanceStatus })
  status: AttendanceStatus;

  @Column({ nullable: true, type: 'text' })
  notes: string;

  @ManyToOne(() => Enrollment, (enrollment) => enrollment.attendances)
  enrollment: Enrollment;
}
