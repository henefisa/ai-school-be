import { Test, TestingModule } from '@nestjs/testing';
import { RoomsController } from './rooms.controller';
import { RoomsService } from './rooms.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { GetRoomsDto } from './dto/get-rooms.dto';
import { DayOfWeek, RoomType } from 'src/shared/constants';

describe('RoomsController', () => {
  let controller: RoomsController;
  let service: RoomsService;

  const mockRoom = {
    id: '1',
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

  const mockRooms = [mockRoom, { ...mockRoom, id: '2', name: 'Physics Lab' }];
  const mockCount = mockRooms.length;

  const mockSchedule = {
    room: mockRoom,
    schedule: {
      MONDAY: [
        {
          classId: '1',
          name: 'Introduction to CS',
          courseName: 'CS101',
          startTime: new Date('2023-01-01T09:00:00'),
          endTime: new Date('2023-01-01T10:30:00'),
          semesterName: 'Fall 2023',
        },
      ],
      TUESDAY: [],
      WEDNESDAY: [],
      THURSDAY: [],
      FRIDAY: [],
      SATURDAY: [],
      SUNDAY: [],
    },
  };

  const mockAnalytics = {
    totalRooms: 10,
    roomsByType: {
      CLASS_ROOM: 5,
      LAB: 3,
      OFFICE: 2,
    },
    mostUsedRooms: [
      {
        id: '1',
        name: 'CS Lab',
        building: 'Science Hall',
        classesCount: 5,
        occupancyRate: 80,
      },
    ],
    leastUsedRooms: [
      {
        id: '2',
        name: 'Physics Lab',
        building: 'Science Hall',
        classesCount: 1,
        occupancyRate: 20,
      },
    ],
    averageOccupancyRate: 60,
  };

  const mockDeleteResponse = { message: 'Room deleted successfully' };

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
            delete: jest.fn().mockResolvedValue(mockDeleteResponse),
            getRoomSchedule: jest.fn().mockResolvedValue(mockSchedule),
            isRoomAvailable: jest.fn().mockResolvedValue(true),
            getRoomUtilizationAnalytics: jest
              .fn()
              .mockResolvedValue(mockAnalytics),
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

      const result = await controller.createRoom(createRoomDto);

      expect(service.create).toHaveBeenCalledWith(createRoomDto);
      expect(result).toEqual(mockRoom);
    });
  });

  describe('getRooms', () => {
    it('should return a list of rooms', async () => {
      const getRoomsDto: GetRoomsDto = { page: 1, pageSize: 10 };

      const result = await controller.getRooms(getRoomsDto);

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

  describe('getRoomSchedule', () => {
    it('should return a room schedule', async () => {
      const result = await controller.getRoomSchedule('1');

      expect(service.getRoomSchedule).toHaveBeenCalledWith('1');
      expect(result).toEqual(mockSchedule);
    });
  });

  describe('checkRoomAvailability', () => {
    it('should check if a room is available', async () => {
      const startTime = '2023-01-01T09:00:00';
      const endTime = '2023-01-01T10:30:00';

      const result = await controller.checkRoomAvailability(
        '1',
        DayOfWeek.Monday,
        startTime,
        endTime,
      );

      expect(service.isRoomAvailable).toHaveBeenCalledWith(
        '1',
        DayOfWeek.Monday,
        new Date(startTime),
        new Date(endTime),
        undefined,
      );
      expect(result).toBe(true);
    });
  });

  describe('getRoomUtilizationAnalytics', () => {
    it('should return room utilization analytics', async () => {
      const result = await controller.getRoomUtilizationAnalytics();

      expect(service.getRoomUtilizationAnalytics).toHaveBeenCalled();
      expect(result).toEqual(mockAnalytics);
    });
  });

  describe('updateRoom', () => {
    it('should update a room by ID', async () => {
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

      const result = await controller.updateRooms('1', updateRoomDto);

      expect(service.update).toHaveBeenCalledWith('1', updateRoomDto);
      expect(result).toEqual({ ...mockRoom, roomNumber: '102' });
    });
  });

  describe('remove', () => {
    it('should delete a room by ID', async () => {
      const result = await controller.remove('1');

      expect(service.delete).toHaveBeenCalledWith('1');
      expect(result).toEqual(mockDeleteResponse);
    });
  });
});
