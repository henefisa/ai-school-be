import { Column, Entity, OneToMany } from 'typeorm';
import { BaseEntity } from './base.entity';
import { StudentAddress } from './student-address.entity';
import { ParentAddress } from './parent-address.entity';
import { TeacherAddress } from './teacher-address.entity';

@Entity('addresses')
export class Address extends BaseEntity {
  @Column()
  addressLine1: string;

  @Column({ nullable: true })
  addressLine2: string;

  @Column({ nullable: true })
  city: string;

  @Column({ nullable: true })
  country: string;

  @OneToMany(() => StudentAddress, (studentAddress) => studentAddress.address)
  studentAddresses: StudentAddress[];

  @OneToMany(() => ParentAddress, (parentAddress) => parentAddress.address)
  parentAddresses: ParentAddress[];

  @OneToMany(() => TeacherAddress, (teacherAddress) => teacherAddress.address)
  teacherAddresses: TeacherAddress[];
}
