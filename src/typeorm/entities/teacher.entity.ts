import {
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  OneToMany,
  OneToOne,
} from 'typeorm';
import { BaseEntity } from './base.entity';
import { Gender } from '../../shared/constants';
import { User } from './user.entity';
import { Department } from './department.entity';
import { ClassAssignment } from './class-assignment.entity';
import { TeacherAddress } from './teacher-address.entity';

/**
 * Teacher entity representing faculty members in the educational system
 */
@Entity('teachers')
export class Teacher extends BaseEntity {
  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ nullable: true, type: 'date' })
  dob: Date;

  @Column({ enum: Gender, type: 'enum', nullable: true })
  gender: Gender;

  @Column({ nullable: true, length: 20 })
  contactNumber: string;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true, type: 'date' })
  hireDate: Date;

  @Column({ nullable: true, type: 'decimal', precision: 10, scale: 2 })
  salary: number;

  @Column({ nullable: true, type: 'uuid' })
  departmentId: string;

  @OneToOne(() => User, (user) => user.teacher)
  user: User;

  @ManyToMany(() => Department, (department) => department.teachers)
  @JoinTable({
    name: 'teacher_departments',
    joinColumn: { name: 'teacher_id' },
    inverseJoinColumn: { name: 'department_id' },
  })
  departments: Department[];

  @OneToMany(
    () => ClassAssignment,
    (classAssignment) => classAssignment.teacher,
  )
  assignments: ClassAssignment[];

  @OneToMany(() => TeacherAddress, (teacherAddress) => teacherAddress.teacher)
  teacherAddresses: TeacherAddress[];
}
