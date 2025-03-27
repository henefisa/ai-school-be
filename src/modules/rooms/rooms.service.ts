import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BaseService } from 'src/shared/base.service';
import { EntityName } from 'src/shared/error-messages';
import { ExistsException } from 'src/shared/exceptions/exists.exception';
import { Room } from 'src/typeorm/entities/room.entity';
import { EntityManager, Not, Repository } from 'typeorm';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { GetRoomsDto } from './dto/get-rooms.dto';

@Injectable()
export class RoomsService extends BaseService<Room> {
  constructor(
    @InjectRepository(Room)
    private readonly roomRepository: Repository<Room>,
  ) {
    super(EntityName.Course, roomRepository);
  }

  async isRoomNumberAvailable(
    roomNumber: string,
    entityManager?: EntityManager,
    id?: string,
  ) {
    const room = await this.getOne(
      {
        where: {
          roomNumber,
          ...(id && { id: Not(id) }),
        },
      },
      entityManager,
    );

    if (room) {
      throw new ExistsException(EntityName.Room);
    }

    return true;
  }

  async create(dto: CreateRoomDto, entityManager?: EntityManager) {
    await this.isRoomNumberAvailable(dto.roomNumber);

    const manager = this.getRepository(entityManager);

    return manager.save({
      roomNumber: dto.roomNumber,
      building: dto.building,
      capacity: dto.capacity,
      roomType: dto.roomType,
      hasProjector: dto.hasProjector,
      hasWhiteboard: dto.hasWhiteboard,
      notes: dto.notes,
    });
  }

  async update(id: string, dto: UpdateRoomDto, entityManager?: EntityManager) {
    const room = await this.getOneOrThrow({
      where: {
        id,
      },
    });

    if (dto.roomNumber) {
      await this.isRoomNumberAvailable(dto.roomNumber, undefined, id);
    }

    Object.assign(room, dto);

    return this.getRepository(entityManager).save(room);
  }

  async delete(id: string, entityManager?: EntityManager) {
    await this.getRepository(entityManager).delete(id);
  }

  async getRooms(dto: GetRoomsDto) {
    const [results, count] = await this.getRepository().findAndCount({
      skip: (dto.page ?? 1 - 1) * (dto.pageSize ?? 10),
      take: dto.pageSize ?? 10,
    });

    return {
      results,
      count,
    };
  }
}
