import { Column, Entity, ManyToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Enrollment } from './enrollment.entity';

@Entity('grades')
export class Grade extends BaseEntity {
  @Column({ nullable: true, type: 'uuid' })
  enrollmentId: string;

  @Column({ nullable: true })
  assignmentName: string;

  @Column({ nullable: true, type: 'decimal' })
  grade: number;

  @Column({ nullable: true, type: 'date' })
  gradeDate: Date;

  @Column({ nullable: true })
  category: string;

  @Column({ nullable: true, type: 'decimal' })
  weighting: number;

  @ManyToOne(() => Enrollment, (enrollment) => enrollment.grades)
  enrollment: Enrollment;
}
