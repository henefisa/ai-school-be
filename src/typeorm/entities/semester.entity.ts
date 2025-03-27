import { Column, Entity, OneToMany } from 'typeorm';
import { BaseEntity } from './base.entity';
import { ClassRoom } from './class.entity';

@Entity('semesters')
export class Semester extends BaseEntity {
  @Column()
  name: string;

  @Column({ nullable: true, type: 'date' })
  startDate: Date;

  @Column({ nullable: true, type: 'date' })
  endDate: Date;

  @Column({ nullable: true, type: 'boolean' })
  currentSemester: boolean;

  @OneToMany(() => ClassRoom, (classRoom) => classRoom.semester)
  classes: ClassRoom[];
}
