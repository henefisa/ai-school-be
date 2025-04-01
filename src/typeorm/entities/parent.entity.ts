import { Column, Entity, OneToMany } from 'typeorm';
import { BaseEntity } from './base.entity';
import { RelationshipToStudent } from 'src/shared/constants';
import { ParentAddress } from './parent-address.entity';
import { Student } from './student.entity';
import { EmergencyContact } from './emergency-contact.entity';

@Entity('parents')
export class Parent extends BaseEntity {
  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ nullable: true, type: 'enum', enum: RelationshipToStudent })
  relationshipToStudent: RelationshipToStudent;

  @Column({ nullable: true })
  contactNumber1: string;

  @Column({ nullable: true })
  contactNumber2: string;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  occupation: string;

  @Column({ nullable: true, type: 'text' })
  notes: string;

  @OneToMany(() => Student, (student) => student.parent)
  students: Student[];

  @OneToMany(() => ParentAddress, (parentAddress) => parentAddress.parent)
  parentAddresses: ParentAddress[];

  @OneToMany(
    () => EmergencyContact,
    (emergencyContact) => emergencyContact.parent,
  )
  emergencyContacts: EmergencyContact[];
}
