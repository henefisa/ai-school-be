import { Test, TestingModule } from '@nestjs/testing';
import { RoomsController } from './rooms.controller';
import { RoomsService } from './rooms.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { GetRoomsDto } from './dto/get-rooms.dto';
import { RoomType } from 'src/shared/constants';

describe('RoomsController', () => {
  let controller: RoomsController;
  let service: RoomsService;

  const mockRoom = {
    id: '1',
    roomNumber: '101',
    building: 'Science Hall',
    capacity: 30,
    roomType: RoomType.ClassRoom,
    hasProjector: true,
    hasWhiteboard: true,
    notes: 'Test Room',
  };

  const mockRooms = [mockRoom, { ...mockRoom, id: '2' }];
  const mockCount = mockRooms.length;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RoomsController],
      providers: [
        {
          provide: RoomsService,
          useValue: {
            create: jest.fn().mockResolvedValue(mockRoom),
            getRooms: jest
              .fn()
              .mockResolvedValue({ results: mockRooms, count: mockCount }),
            getOneOrThrow: jest.fn().mockResolvedValue(mockRoom),
            update: jest
              .fn()
              .mockResolvedValue({ ...mockRoom, roomNumber: '102' }),
            delete: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    controller = module.get<RoomsController>(RoomsController);
    service = module.get<RoomsService>(RoomsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createRoom', () => {
    it('should create a room', async () => {
      const createRoomDto: CreateRoomDto = {
        roomNumber: '101',
        building: 'Science Hall',
        capacity: 30,
        roomType: RoomType.ClassRoom,
        hasProjector: true,
        hasWhiteboard: true,
        notes: 'Test Room',
      };

      const result = await controller.createRoom(createRoomDto);

      expect(service.create).toHaveBeenCalledWith(createRoomDto);
      expect(result).toEqual(mockRoom);
    });
  });

  describe('getRooms', () => {
    it('should return a list of rooms', async () => {
      const getRoomsDto: GetRoomsDto = { page: 1, pageSize: 10 };

      const result = await controller.getRoom(getRoomsDto);

      expect(service.getRooms).toHaveBeenCalledWith(getRoomsDto);
      expect(result).toEqual({ results: mockRooms, count: mockCount });
    });
  });

  describe('getRoomById', () => {
    it('should return a room by ID', async () => {
      const result = await controller.getRoomById('1');

      expect(service.getOneOrThrow).toHaveBeenCalledWith({
        where: { id: '1' },
      });
      expect(result).toEqual(mockRoom);
    });
  });

  describe('updateRoom', () => {
    it('should update a room by ID', async () => {
      const updateRoomDto: UpdateRoomDto = {
        roomNumber: '102',
        building: 'Science Hall',
        capacity: 40,
        roomType: RoomType.Lab,
        hasProjector: false,
        hasWhiteboard: true,
        notes: 'Updated Room',
      };

      const result = await controller.updateRooms('1', updateRoomDto);

      expect(service.update).toHaveBeenCalledWith('1', updateRoomDto);
      expect(result).toEqual({ ...mockRoom, roomNumber: '102' });
    });
  });

  describe('remove', () => {
    it('should delete a room by ID', async () => {
      const result = await controller.remove('1');

      expect(service.delete).toHaveBeenCalledWith('1');
      expect(result).toBeUndefined();
    });
  });
});
