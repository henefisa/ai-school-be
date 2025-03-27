import { Test, TestingModule } from '@nestjs/testing';
import { Repository } from 'typeorm/repository/Repository';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ExistsException } from 'src/shared/exceptions/exists.exception';
import { EntityName } from 'src/shared/error-messages';
import { RoomsService } from './rooms.service';
import { Room } from 'src/typeorm/entities/room.entity';
import { RoomType } from 'src/shared/constants';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';

describe('CoursesService', () => {
  let service: RoomsService;
  let repository: Repository<Room>;

  const mockRoom = {
    id: '1',
    roomNumber: '101',
    building: 'Science Hall',
    capacity: 30,
    roomType: RoomType.ClassRoom,
    hasProjector: true,
    hasWhiteboard: true,
    notes: 'This is a test room.',
  } as Room;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoomsService,
        {
          provide: getRepositoryToken(Room),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
            delete: jest.fn(),
            findAndCount: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<RoomsService>(RoomsService);
    repository = module.get<Repository<Room>>(getRepositoryToken(Room));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a room if room number is available', async () => {
      const createRoomDto: CreateRoomDto = {
        roomNumber: '101',
        building: 'Science Hall',
        capacity: 30,
        roomType: RoomType.ClassRoom,
        hasProjector: true,
        hasWhiteboard: true,
        notes: 'Test Room',
      };

      jest.spyOn(service, 'isRoomNumberAvailable').mockResolvedValue(true);
      jest.spyOn(repository, 'save').mockResolvedValue(mockRoom);

      const result = await service.create(createRoomDto);

      expect(service.isRoomNumberAvailable).toHaveBeenCalledWith(
        createRoomDto.roomNumber,
      );
      expect(repository.save).toHaveBeenCalledWith(createRoomDto);
      expect(result).toEqual(mockRoom);
    });

    it('should throw an error if room number is not available', async () => {
      const createRoomDto: CreateRoomDto = {
        roomNumber: '101',
        building: 'Science Hall',
        capacity: 30,
        roomType: RoomType.ClassRoom,
        hasProjector: true,
        hasWhiteboard: true,
        notes: 'Test Room',
      };

      jest
        .spyOn(service, 'isRoomNumberAvailable')
        .mockRejectedValue(new ExistsException(EntityName.Room));

      await expect(service.create(createRoomDto)).rejects.toThrow(
        ExistsException,
      );
      expect(repository.save).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update a room if room number is available', async () => {
      const updateRoomDto: UpdateRoomDto = {
        roomNumber: '102',
        building: 'Science Hall',
        capacity: 40,
        roomType: RoomType.Lab,
        hasProjector: false,
        hasWhiteboard: true,
        notes: 'Updated Room',
      };

      jest.spyOn(service, 'isRoomNumberAvailable').mockResolvedValue(true);
      jest.spyOn(service, 'getOneOrThrow').mockResolvedValue(mockRoom);
      jest
        .spyOn(repository, 'save')
        .mockResolvedValue({ ...mockRoom, ...updateRoomDto });

      const result = await service.update('1', updateRoomDto);

      expect(service.getOneOrThrow).toHaveBeenCalledWith({
        where: { id: '1' },
      });
      expect(service.isRoomNumberAvailable).toHaveBeenCalledWith(
        updateRoomDto.roomNumber,
        null,
        '1',
      );
      expect(repository.save).toHaveBeenCalledWith({
        ...mockRoom,
        ...updateRoomDto,
      });
      expect(result).toEqual({ ...mockRoom, ...updateRoomDto });
    });

    it('should throw an error if room number is not available', async () => {
      const updateRoomDto: UpdateRoomDto = {
        roomNumber: '101',
        building: 'Science Hall',
        capacity: 30,
        roomType: RoomType.Lab,
        hasProjector: false,
        hasWhiteboard: true,
        notes: 'Test Room',
      };

      jest.spyOn(service, 'getOneOrThrow').mockResolvedValue(mockRoom);
      jest
        .spyOn(service, 'isRoomNumberAvailable')
        .mockRejectedValue(new ExistsException(EntityName.Room));

      await expect(service.update('1', updateRoomDto)).rejects.toThrow(
        ExistsException,
      );
      expect(repository.save).not.toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('should delete a room by id', async () => {
      const result = await service.delete('1');

      expect(repository.delete).toHaveBeenCalledWith({ id: '1' });
      expect(result).toBeUndefined();
    });
  });

  describe('getCourses', () => {
    it('should return a paginated list of rooms', async () => {
      const getRoomsDto = { page: 1, pageSize: 10 };
      const mockRooms = [mockRoom, { ...mockRoom, id: '2' }];
      const mockCount = mockRooms.length;

      jest
        .spyOn(repository, 'findAndCount')
        .mockResolvedValue([mockRooms, mockCount]);

      const result = await service.getRooms(getRoomsDto);

      expect(repository.findAndCount).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
      });
      expect(result).toEqual({
        results: mockRooms,
        count: mockCount,
      });
    });
  });
});
