import {
  Column,
  Entity,
  JoinColumn,
  ManyToMany,
  OneToMany,
  OneToOne,
} from 'typeorm';
import { BaseEntity } from './base.entity';
import { Course } from './course.entity';
import { Teacher } from './teacher.entity';

/**
 * Department entity representing academic departments in the educational system
 */
@Entity('departments', {
  orderBy: {
    updatedAt: 'DESC',
  },
})
export class Department extends BaseEntity {
  @Column()
  name: string;

  @Column({ nullable: true, unique: true })
  code: string;

  @Column({
    nullable: true,
    type: 'uuid',
    comment: 'UUID of the department head teacher',
  })
  headId: string | null;

  @Column({ nullable: true, default: '' })
  description: string;

  @Column({ nullable: true, default: '' })
  location: string;

  @Column({ nullable: true, default: '' })
  email: string;

  @Column({ nullable: true, default: '' })
  phoneNumber: string;

  @OneToOne(() => Teacher)
  @JoinColumn({ name: 'head_id' })
  head: Teacher;

  @OneToMany(() => Course, (course) => course.department)
  courses: Course[];

  @ManyToMany(() => Teacher, (teacher) => teacher.departments)
  teachers: Teacher[];
}
