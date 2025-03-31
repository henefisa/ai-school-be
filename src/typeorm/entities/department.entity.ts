import { Column, Entity, ManyToMany, OneToMany } from 'typeorm';
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

  @Column({
    nullable: true,
    type: 'uuid',
    comment: 'UUID of the department head teacher',
  })
  head: string | null;

  @OneToMany(() => Course, (course) => course.department)
  courses: Course[];

  @ManyToMany(() => Teacher, (teacher) => teacher.departments)
  teachers: Teacher[];
}
