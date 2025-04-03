import { Column, Entity, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Department } from './department.entity';
import { ClassRoom } from './class.entity';
import { CoursePrerequisite } from './course-prerequisite.entity';

/**
 * Course entity representing academic courses in the educational system
 */
@Entity('courses', { orderBy: { updatedAt: 'DESC' } })
export class Course extends BaseEntity {
  @Column()
  name: string;

  @Column({ nullable: false, unique: true })
  code: string;

  @Column({ nullable: true, type: 'text' })
  description: string;

  @Column({ nullable: true, type: 'uuid' })
  departmentId: string;

  @Column({ nullable: true, type: 'integer', default: 0 })
  credits: number;

  @Column({ nullable: true, type: 'boolean', default: false })
  required: boolean;

  @Column({ nullable: true, type: 'varchar', length: 50, default: 'ACTIVE' })
  status: string;

  @ManyToOne(() => Department, (department) => department.courses)
  department: Department;

  @OneToMany(() => ClassRoom, (classRoom) => classRoom.course)
  classes: ClassRoom[];

  @OneToMany(() => CoursePrerequisite, (prerequisite) => prerequisite.course)
  prerequisites: CoursePrerequisite[];

  @OneToMany(
    () => CoursePrerequisite,
    (prerequisite) => prerequisite.prerequisite,
  )
  isPrerequisiteFor: CoursePrerequisite[];
}
