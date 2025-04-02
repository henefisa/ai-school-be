import { Test, TestingModule } from '@nestjs/testing';
import { Repository } from 'typeorm/repository/Repository';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ExistsException } from 'src/shared/exceptions/exists.exception';
import { EntityName } from 'src/shared/error-messages';
import { RoomsService } from './rooms.service';
import { Room } from 'src/typeorm/entities/room.entity';
import { DayOfWeek, RoomType } from 'src/shared/constants';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { BadRequestException } from '@nestjs/common';
import { ClassRoom } from 'src/typeorm/entities/class.entity';

describe('RoomsService', () => {
  let service: RoomsService;
  let repository: Repository<Room>;
  let classRoomRepository: Repository<ClassRoom>;

  const mockRoom = {
    id: '1',
    roomNumber: '101',
    name: 'CS Lab',
    building: 'Science Hall',
    capacity: 30,
    roomType: RoomType.ClassRoom,
    hasProjector: true,
    hasWhiteboard: true,
    notes: 'This is a test room.',
    features: ['Air Conditioning', 'Smart Board'],
    status: 'ACTIVE',
    operationalHours: {
      monday: [{ start: '08:00', end: '18:00' }],
      tuesday: [{ start: '08:00', end: '18:00' }],
    },
    location: 'First floor, east wing',
    description: 'Computer science laboratory',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: undefined,
    classes: [],
  } as unknown as Room;

  const mockClassRoom = {
    id: '1',
    roomId: '1',
    dayOfWeek: DayOfWeek.Monday,
    startTime: new Date('2023-01-01T09:00:00Z'),
    endTime: new Date('2023-01-01T10:30:00Z'),
    name: 'CS101',
    course: { name: 'Intro to CS' },
    semester: { name: 'Fall 2023' },
    enrollments: [{ id: '1' }, { id: '2' }],
  } as ClassRoom;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoomsService,
        {
          provide: getRepositoryToken(Room),
          useValue: {
            findOne: jest.fn(),
            find: jest.fn(),
            save: jest.fn(),
            softDelete: jest.fn(),
            delete: jest.fn(),
            findAndCount: jest.fn(),
            count: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(ClassRoom),
          useValue: {
            find: jest.fn(),
            count: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<RoomsService>(RoomsService);
    repository = module.get<Repository<Room>>(getRepositoryToken(Room));
    classRoomRepository = module.get<Repository<ClassRoom>>(
      getRepositoryToken(ClassRoom),
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a room if room number and name are available', async () => {
      const createRoomDto: CreateRoomDto = {
        roomNumber: '101',
        name: 'CS Lab',
        building: 'Science Hall',
        capacity: 30,
        roomType: RoomType.ClassRoom,
        hasProjector: true,
        hasWhiteboard: true,
        notes: 'Test Room',
        features: ['Air Conditioning', 'Smart Board'],
        status: 'ACTIVE',
        operationalHours: {
          monday: [{ start: '08:00', end: '18:00' }],
          tuesday: [{ start: '08:00', end: '18:00' }],
        },
        location: 'First floor, east wing',
        description: 'Computer science laboratory',
      };

      jest.spyOn(service, 'isRoomNumberAvailable').mockResolvedValue(true);
      jest.spyOn(service, 'isRoomNameAvailable').mockResolvedValue(true);
      jest.spyOn(repository, 'save').mockResolvedValue(mockRoom);

      const result = await service.create(createRoomDto);

      expect(service.isRoomNumberAvailable).toHaveBeenCalledWith(
        createRoomDto.roomNumber,
      );
      expect(service.isRoomNameAvailable).toHaveBeenCalledWith(
        createRoomDto.name,
      );
      expect(result).toEqual(mockRoom);
    });

    it('should throw an error if room number is not available', async () => {
      const createRoomDto: CreateRoomDto = {
        roomNumber: '101',
        name: 'CS Lab',
        building: 'Science Hall',
        capacity: 30,
        roomType: RoomType.ClassRoom,
        hasProjector: true,
        hasWhiteboard: true,
        notes: 'Test Room',
        features: ['Air Conditioning', 'Smart Board'],
        status: 'ACTIVE',
        operationalHours: {
          monday: [{ start: '08:00', end: '18:00' }],
          tuesday: [{ start: '08:00', end: '18:00' }],
        },
        location: 'First floor, east wing',
        description: 'Computer science laboratory',
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
    it('should update a room if room number and name are available', async () => {
      const updateRoomDto: UpdateRoomDto = {
        roomNumber: '102',
        name: 'Updated CS Lab',
        building: 'Science Hall',
        capacity: 40,
        roomType: RoomType.Lab,
        hasProjector: false,
        hasWhiteboard: true,
        notes: 'Updated Room',
        features: ['Air Conditioning', 'Smart Board', 'Cameras'],
      };

      jest.spyOn(service, 'isRoomNumberAvailable').mockResolvedValue(true);
      jest.spyOn(service, 'isRoomNameAvailable').mockResolvedValue(true);
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
        undefined,
        '1',
      );
      expect(service.isRoomNameAvailable).toHaveBeenCalledWith(
        updateRoomDto.name,
        undefined,
        '1',
      );
      expect(result).toEqual({ ...mockRoom, ...updateRoomDto });
    });

    it('should throw an error if room number is not available', async () => {
      const updateRoomDto: UpdateRoomDto = {
        roomNumber: '101',
        name: 'Updated CS Lab',
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
    it('should delete a room if no classes are using it', async () => {
      jest.spyOn(classRoomRepository, 'count').mockResolvedValue(0);
      jest
        .spyOn(repository, 'softDelete')
        .mockResolvedValue({ affected: 1 } as any);

      const result = await service.delete('1');

      expect(classRoomRepository.count).toHaveBeenCalledWith({
        where: { roomId: '1' },
      });
      expect(repository.softDelete).toHaveBeenCalledWith('1');
      expect(result).toEqual({ message: 'Room deleted successfully' });
    });

    it('should throw an error if classes are using the room', async () => {
      jest.spyOn(classRoomRepository, 'count').mockResolvedValue(2);

      await expect(service.delete('1')).rejects.toThrow(BadRequestException);
      expect(repository.softDelete).not.toHaveBeenCalled();
    });
  });

  describe('getRooms', () => {
    it('should return a paginated list of rooms', async () => {
      const getRoomsDto = { page: 1, pageSize: 10 };
      const mockRooms = [mockRoom, { ...mockRoom, id: '2' }];
      const mockCount = mockRooms.length;

      jest
        .spyOn(repository, 'findAndCount')
        .mockResolvedValue([mockRooms, mockCount]);

      const result = await service.getRooms(getRoomsDto);

      expect(repository.findAndCount).toHaveBeenCalled();
      expect(result).toEqual({
        results: mockRooms,
        count: mockCount,
      });
    });
  });

  describe('isRoomAvailable', () => {
    it('should return true if room is available', async () => {
      jest.spyOn(service, 'getOneOrThrow').mockResolvedValue(mockRoom);
      jest.spyOn(classRoomRepository, 'count').mockResolvedValue(0);

      const result = await service.isRoomAvailable(
        '1',
        DayOfWeek.Monday,
        new Date('2023-01-01T09:00:00Z'),
        new Date('2023-01-01T10:30:00Z'),
      );

      expect(result).toBe(true);
    });

    it('should return false if room has conflicting classes', async () => {
      jest.spyOn(service, 'getOneOrThrow').mockResolvedValue(mockRoom);
      jest.spyOn(classRoomRepository, 'count').mockResolvedValue(1);

      const result = await service.isRoomAvailable(
        '1',
        DayOfWeek.Monday,
        new Date('2023-01-01T09:00:00Z'),
        new Date('2023-01-01T10:30:00Z'),
      );

      expect(result).toBe(false);
    });
  });

  describe('getRoomSchedule', () => {
    it('should return a room schedule', async () => {
      jest.spyOn(service, 'getOneOrThrow').mockResolvedValue(mockRoom);
      jest
        .spyOn(classRoomRepository, 'find')
        .mockResolvedValue([mockClassRoom]);

      const result = await service.getRoomSchedule('1');

      expect(service.getOneOrThrow).toHaveBeenCalledWith({
        where: { id: '1' },
      });
      expect(classRoomRepository.find).toHaveBeenCalledWith({
        where: { roomId: '1' },
        relations: {
          course: true,
          semester: true,
        },
      });
      expect(result).toHaveProperty('room');
      expect(result).toHaveProperty('schedule');
    });
  });
});
