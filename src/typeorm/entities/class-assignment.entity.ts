import { Column, Entity, ManyToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { ClassRoom } from './class.entity';
import { Teacher } from './teacher.entity';

@Entity('class_assignments')
export class ClassAssignment extends BaseEntity {
  @Column({ type: 'uuid' })
  classId: string;

  @Column({ type: 'uuid' })
  teacherId: string;

  @Column({ nullable: true, type: 'date' })
  startDate: Date;

  @Column({ nullable: true, type: 'date' })
  endDate: Date;

  @ManyToOne(() => ClassRoom, (classRoom) => classRoom.assignments)
  classRoom: ClassRoom;

  @ManyToOne(() => Teacher, (teacher) => teacher.assignments)
  teacher: Teacher;
}
