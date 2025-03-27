import { Column, Entity, ManyToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Student } from './student.entity';
import { Address } from './address.entity';

@Entity('student_addresses')
export class StudentAddress extends BaseEntity {
  @Column({ nullable: true, type: 'uuid' })
  studentId: string;

  @Column({ nullable: true, type: 'uuid' })
  addressId: string;

  @Column({ nullable: true })
  addressType: string;

  @ManyToOne(() => Student, (student) => student.studentAddresses)
  student: Student;

  @ManyToOne(() => Address, (address) => address.studentAddresses)
  address: Address;
}
