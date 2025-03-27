import { Column, Entity, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Department } from './department.entity';
import { ClassRoom } from './class.entity';

@Entity('courses', { orderBy: { updatedAt: 'DESC' } })
export class Course extends BaseEntity {
  @Column()
  name: string;

  @Column({ nullable: true, type: 'text' })
  description: string;

  @Column({ nullable: true, type: 'uuid' })
  departmentId: string;

  @Column({ nullable: true, type: 'integer' })
  credits: number;

  @Column({ nullable: true, type: 'boolean' })
  required: boolean;

  @ManyToOne(() => Department, (department) => department.courses)
  department: Department;

  @OneToMany(() => ClassRoom, (classRoom) => classRoom.course)
  classes: ClassRoom[];
}
