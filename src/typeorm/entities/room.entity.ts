import { Column, Entity } from 'typeorm';
import { BaseEntity } from './base.entity';
import { RoomType } from 'src/shared/constants';

@Entity('rooms')
export class Room extends BaseEntity {
  @Column()
  roomNumber: string;

  @Column()
  building: string;

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
}
