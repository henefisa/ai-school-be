import { Column, Entity, ManyToOne, OneToMany, OneToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Gender } from '../../shared/constants';
import { StudentAddress } from './student-address.entity';
import { Parent } from './parent.entity';
import { User } from './user.entity';
import { Enrollment } from './enrollment.entity';

/**
 * Student entity representing students in the educational system
 */
@Entity('students')
export class Student extends BaseEntity {
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

  @Column({ nullable: true, type: 'uuid' })
  parentId: string;

  @Column({ nullable: true, type: 'date' })
  enrollmentDate: Date;

  @ManyToOne(() => Parent, (parent) => parent.students)
  parent: Parent;

  @OneToMany(() => StudentAddress, (studentAddress) => studentAddress.student)
  studentAddresses: StudentAddress[];

  @OneToOne(() => User, (user) => user.student)
  user: User;

  @OneToMany(() => Enrollment, (enrollment) => enrollment.student)
  enrollments: Enrollment[];
}
