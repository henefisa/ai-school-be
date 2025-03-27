import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Grade as EGrade } from 'src/shared/constants';
import { Student } from './student.entity';
import { ClassRoom } from './class.entity';
import { Attendance } from './attendance.entity';
import { Grade } from './grade.entity';

@Entity('enrollments')
export class Enrollment extends BaseEntity {
  @Column({ nullable: true, type: 'uuid' })
  studentId: string;

  @Column({ nullable: true, type: 'uuid' })
  classId: string;

  @Column({ nullable: true, type: 'date' })
  enrollmentDate: Date;

  @Column({ nullable: true, type: 'enum', enum: EGrade })
  grade: EGrade;

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
