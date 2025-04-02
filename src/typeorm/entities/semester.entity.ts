import {
  Column,
  Entity,
  OneToMany,
  ManyToMany,
  JoinTable,
  Index,
} from 'typeorm';
import { BaseEntity } from './base.entity';
import { ClassRoom } from './class.entity';
import { Course } from './course.entity';
import { SemesterStatus } from 'src/shared/constants';
import { Student } from './student.entity';
import { Teacher } from './teacher.entity';

@Entity('semesters')
export class Semester extends BaseEntity {
  @Column()
  @Index({ unique: true })
  name: string;

  @Column({ type: 'date' })
  startDate: Date;

  @Column({ type: 'date' })
  endDate: Date;

  @Column({
    type: 'enum',
    enum: SemesterStatus,
    default: SemesterStatus.Upcoming,
  })
  status: SemesterStatus;

  @Column({ nullable: true, type: 'boolean', default: false })
  currentSemester: boolean;

  @Column({ nullable: true })
  academicYear: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @OneToMany(() => ClassRoom, (classRoom) => classRoom.semester)
  classes: ClassRoom[];

  @ManyToMany(() => Course)
  @JoinTable({
    name: 'semester_courses',
    joinColumn: { name: 'semester_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'course_id', referencedColumnName: 'id' },
  })
  courses: Course[];

  @ManyToMany(() => Student)
  @JoinTable({
    name: 'semester_students',
    joinColumn: { name: 'semester_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'student_id', referencedColumnName: 'id' },
  })
  students: Student[];

  @ManyToMany(() => Teacher)
  @JoinTable({
    name: 'semester_teachers',
    joinColumn: { name: 'semester_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'teacher_id', referencedColumnName: 'id' },
  })
  teachers: Teacher[];
}
