import { Column, Entity, ManyToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Address } from './address.entity';
import { Parent } from './parent.entity';

@Entity('parent_addresses')
export class ParentAddress extends BaseEntity {
  @Column({ nullable: true, type: 'uuid' })
  studentId: string;

  @Column({ nullable: true, type: 'uuid' })
  parentId: string;

  @Column({ nullable: true })
  addressType: string;

  @ManyToOne(() => Parent, (parent) => parent.parentAddresses)
  parent: Parent;

  @ManyToOne(() => Address, (address) => address.parentAddresses)
  address: Address;
}
