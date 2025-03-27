import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from './base.entity';
import { DayOfWeek } from '../../shared/constants';
import { Enrollment } from './enrollment.entity';
import { ClassAssignment } from './class-assignment.entity';
import { Course } from './course.entity';
import { Semester } from './semester.entity';
import { Room } from './room.entity';

/**
 * ClassRoom entity representing class sections in the educational system
 */
@Entity('classes')
export class ClassRoom extends BaseEntity {
  @Column({ nullable: true, type: 'uuid' })
  courseId: string;

  @Column({ nullable: true, type: 'uuid' })
  semesterId: string;

  @Column({ nullable: true })
  name: string;

  @Column({ nullable: true, type: 'timestamptz' })
  startTime: Date;

  @Column({ nullable: true, type: 'timestamptz' })
  endTime: Date;

  @Column({ nullable: true, type: 'enum', enum: DayOfWeek })
  dayOfWeek: DayOfWeek;

  @Column({ nullable: true, type: 'uuid' })
  roomId: string;

  @Column({ nullable: true, type: 'integer' })
  maxEnrollment: number;

  @OneToMany(() => Enrollment, (enrollment) => enrollment.classRoom)
  enrollments: Enrollment[];

  @OneToMany(
    () => ClassAssignment,
    (classAssignment) => classAssignment.classRoom,
  )
  assignments: ClassAssignment[];

  @ManyToOne(() => Course, (course) => course.classes)
  course: Course;

  @ManyToOne(() => Semester, (semester) => semester.classes)
  semester: Semester;

  @ManyToOne(() => Room)
  @JoinColumn({ name: 'room_id' })
  room: Room;
}
