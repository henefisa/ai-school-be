import { Column, Entity, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Parent } from './parent.entity';

@Entity('emergency_contacts')
export class EmergencyContact extends BaseEntity {
  @Column()
  name: string;

  @Column()
  relationship: string;

  @Column()
  phoneNumber: string;

  @Column({ nullable: true })
  email: string;

  @Column()
  parentId: string;

  @ManyToOne(() => Parent)
  @JoinColumn({ name: 'parent_id' })
  parent: Parent;
}
