import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Grade as EGrade, EnrollmentStatus } from 'src/shared/constants';
import { Student } from './student.entity';
import { ClassRoom } from './class.entity';
import { Attendance } from './attendance.entity';
import { Grade } from './grade.entity';

@Entity('enrollments')
export class Enrollment extends BaseEntity {
  @Column({ type: 'uuid' })
  studentId: string;

  @Column({ type: 'uuid' })
  classId: string;

  @Column({ type: 'date', default: () => 'CURRENT_DATE' })
  enrollmentDate: Date;

  @Column({
    type: 'enum',
    enum: EnrollmentStatus,
    default: EnrollmentStatus.Active,
  })
  status: EnrollmentStatus;

  @Column({ nullable: true, type: 'jsonb' })
  statusHistory: {
    status: EnrollmentStatus;
    date: Date;
    reason?: string;
  }[];

  @Column({ nullable: true, type: 'enum', enum: EGrade })
  grade: EGrade;

  @Column({ nullable: true, type: 'text' })
  notes: string;

  @Column({ nullable: true, type: 'date' })
  completionDate: Date;

  @ManyToOne(() => Student, (student) => student.enrollments)
  student: Student;

  @ManyToOne(() => ClassRoom, (classRoom) => classRoom.enrollments)
  @JoinColumn({ name: 'class_id' })
  classRoom: ClassRoom;

  @OneToMany(() => Attendance, (attendance) => attendance.enrollment)
  attendances: Attendance[];

  @OneToMany(() => Grade, (grade) => grade.enrollment)
  grades: Grade[];
}
