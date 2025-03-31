import { Column, Entity, ManyToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Address } from './address.entity';
import { Teacher } from './teacher.entity';

@Entity('teacher_addresses')
export class TeacherAddress extends BaseEntity {
  @Column({ type: 'uuid' })
  teacherId: string;

  @Column({ type: 'uuid' })
  addressId: string;

  @Column({ nullable: true })
  addressType: string;

  @ManyToOne(() => Teacher, (teacher) => teacher.teacherAddresses)
  teacher: Teacher;

  @ManyToOne(() => Address, (address) => address.teacherAddresses)
  address: Address;
}
