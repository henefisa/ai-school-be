import { Column, Entity, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Course } from './course.entity';

/**
 * CoursePrerequisite entity representing prerequisite relationships between courses
 */
@Entity('course_prerequisites')
@Unique(['courseId', 'prerequisiteId'])
export class CoursePrerequisite extends BaseEntity {
  @Column({ type: 'uuid' })
  courseId: string;

  @Column({ type: 'uuid' })
  prerequisiteId: string;

  @Column({ nullable: true, type: 'text' })
  notes: string;

  @Column({ type: 'boolean', default: true })
  isRequired: boolean;

  @Column({ nullable: true, type: 'varchar', length: 50 })
  minGrade: string;

  @ManyToOne(() => Course)
  @JoinColumn({ name: 'course_id' })
  course: Course;

  @ManyToOne(() => Course)
  @JoinColumn({ name: 'prerequisite_id' })
  prerequisite: Course;
}
