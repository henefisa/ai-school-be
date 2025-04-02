import { Column, Entity, OneToMany } from 'typeorm';
import { BaseEntity } from './base.entity';
import { RoomType } from 'src/shared/constants';
import { ClassRoom } from './class.entity';

@Entity('rooms')
export class Room extends BaseEntity {
  @Column()
  roomNumber: string;

  @Column()
  building: string;

  @Column({ nullable: true })
  name: string;

  @Column({ nullable: true, type: 'int' })
  capacity: number;

  @Column({ nullable: true, type: 'enum', enum: RoomType })
  roomType: RoomType;

  @Column({ type: 'boolean', default: true })
  hasProjector: boolean;

  @Column({ type: 'boolean', default: true })
  hasWhiteboard: boolean;

  @Column({ nullable: true })
  notes?: string;

  @Column({ nullable: true, type: 'jsonb', default: [] })
  features: string[];

  @Column({ nullable: true, type: 'jsonb' })
  operationalHours: {
    monday?: { start: string; end: string }[];
    tuesday?: { start: string; end: string }[];
    wednesday?: { start: string; end: string }[];
    thursday?: { start: string; end: string }[];
    friday?: { start: string; end: string }[];
    saturday?: { start: string; end: string }[];
    sunday?: { start: string; end: string }[];
  };

  @Column({ nullable: true, type: 'varchar', length: 50, default: 'ACTIVE' })
  status: string;

  @Column({ nullable: true, type: 'varchar', length: 255 })
  location: string;

  @Column({ nullable: true, type: 'text' })
  description: string;

  @OneToMany(() => ClassRoom, (classRoom) => classRoom.room)
  classes: ClassRoom[];
}
