import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BaseService } from 'src/shared/base.service';
import { EntityName } from 'src/shared/error-messages';
import { ExistsException } from 'src/shared/exceptions/exists.exception';
import { Room } from 'src/typeorm/entities/room.entity';
import {
  EntityManager,
  ILike,
  Not,
  Repository,
  LessThanOrEqual,
  MoreThanOrEqual,
  In,
} from 'typeorm';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { GetRoomsDto } from './dto/get-rooms.dto';
import { ClassRoom } from 'src/typeorm/entities/class.entity';
import { DayOfWeek } from 'src/shared/constants';

@Injectable()
export class RoomsService extends BaseService<Room> {
  constructor(
    @InjectRepository(Room)
    private readonly roomRepository: Repository<Room>,
    @InjectRepository(ClassRoom)
    private readonly classRoomRepository: Repository<ClassRoom>,
  ) {
    super(EntityName.Room, roomRepository);
  }

  /**
   * Check if room number is available
   * @param roomNumber
   * @param entityManager
   * @param id
   * @returns true if available
   */
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

  /**
   * Check if room name is available
   * @param name
   * @param entityManager
   * @param id
   * @returns true if available
   */
  async isRoomNameAvailable(
    name: string | undefined,
    entityManager?: EntityManager,
    id?: string,
  ) {
    if (!name) {
      return true;
    }

    const room = await this.getOne(
      {
        where: {
          name,
          ...(id && { id: Not(id) }),
        },
      },
      entityManager,
    );

    if (room) {
      throw new BadRequestException(`Room with name "${name}" already exists`);
    }

    return true;
  }

  /**
   * Create a new room
   * @param dto room data
   * @param entityManager optional entity manager for transactions
   * @returns created room
   */
  async create(dto: CreateRoomDto, entityManager?: EntityManager) {
    await this.isRoomNumberAvailable(dto.roomNumber);

    if (dto.name) {
      await this.isRoomNameAvailable(dto.name);
    }

    const manager = this.getRepository(entityManager);

    return manager.save({
      roomNumber: dto.roomNumber,
      building: dto.building,
      name: dto.name,
      capacity: dto.capacity,
      roomType: dto.roomType,
      hasProjector: dto.hasProjector,
      hasWhiteboard: dto.hasWhiteboard,
      features: dto.features,
      operationalHours: dto.operationalHours,
      status: dto.status || 'ACTIVE',
      location: dto.location,
      description: dto.description,
      notes: dto.notes,
    });
  }

  /**
   * Update a room
   * @param id room ID
   * @param dto update data
   * @param entityManager optional entity manager for transactions
   * @returns updated room
   */
  async update(id: string, dto: UpdateRoomDto, entityManager?: EntityManager) {
    const room = await this.getOneOrThrow({
      where: {
        id,
      },
    });

    if (dto.roomNumber && dto.roomNumber !== room.roomNumber) {
      await this.isRoomNumberAvailable(dto.roomNumber, undefined, id);
    }

    // Only check name validation if room has a name property and DTO contains a name
    if (room.name && 'name' in dto && dto['name'] !== room.name) {
      await this.isRoomNameAvailable(dto['name'], undefined, id);
    }

    Object.assign(room, dto);

    return this.getRepository(entityManager).save(room);
  }

  /**
   * Delete a room
   * @param id room ID
   * @param entityManager optional entity manager for transactions
   * @returns deletion confirmation
   */
  async delete(id: string, entityManager?: EntityManager) {
    // Check if any classes are using this room
    const classesCount = await this.classRoomRepository.count({
      where: { roomId: id },
    });

    if (classesCount > 0) {
      throw new BadRequestException(
        `Cannot delete room with ${classesCount} class(es) assigned. Please reassign classes first.`,
      );
    }

    await this.getRepository(entityManager).softDelete(id);
    return { message: 'Room deleted successfully' };
  }

  /**
   * Get rooms with filtering and sorting options
   * @param dto search parameters
   * @returns rooms and count
   */
  async getRooms(dto: GetRoomsDto) {
    const where: any = {};

    // Basic filters
    if (dto.roomNumber) {
      where.roomNumber = ILike(`%${dto.roomNumber}%`);
    }

    if (dto.name) {
      where.name = ILike(`%${dto.name}%`);
    }

    if (dto.building) {
      where.building = ILike(`%${dto.building}%`);
    }

    if (dto.minCapacity) {
      where.capacity = MoreThanOrEqual(dto.minCapacity);
    }

    if (dto.roomType) {
      where.roomType = dto.roomType;
    }

    if (dto.status) {
      where.status = dto.status;
    }

    if (dto.hasProjector !== undefined) {
      where.hasProjector = dto.hasProjector;
    }

    if (dto.hasWhiteboard !== undefined) {
      where.hasWhiteboard = dto.hasWhiteboard;
    }

    // Feature filter (search in JSON array)
    if (dto.feature) {
      // This approach depends on your database system
      // For PostgreSQL, using the @> operator to check if array contains value
      where.features = () => `features @> ARRAY['${dto.feature}']::varchar[]`;
    }

    // Set up sorting
    const orderBy: Record<string, 'ASC' | 'DESC'> = {};
    if (dto.sortBy) {
      orderBy[dto.sortBy] = dto.sortOrder || 'ASC';
    } else {
      orderBy.updatedAt = 'DESC';
    }

    // Availability filters
    if (dto.date || dto.time || dto.dayOfWeek || dto.notBookedFor) {
      // We'll need to modify our query to exclude rooms that are booked
      const roomsToExclude = await this.findBookedRooms(dto);
      if (roomsToExclude.length > 0) {
        where.id = Not(In(roomsToExclude));
      }
    }

    // Query with pagination
    const [results, count] = await this.getRepository().findAndCount({
      where,
      order: orderBy,
      skip: ((dto.page || 1) - 1) * (dto.pageSize || 10),
      take: dto.pageSize || 10,
    });

    return {
      results,
      count,
    };
  }

  /**
   * Find rooms that are already booked based on search criteria
   * @param dto search parameters with date, time, dayOfWeek
   * @returns array of room IDs that are booked
   */
  private async findBookedRooms(dto: GetRoomsDto): Promise<string[]> {
    let dayOfWeek: DayOfWeek | undefined;
    let startTime: Date | undefined;
    let endTime: Date | undefined;

    // Convert date string to Date if provided
    if (dto.date) {
      const dateObj = new Date(dto.date);
      if (isNaN(dateObj.getTime())) {
        throw new BadRequestException('Invalid date format. Use YYYY-MM-DD');
      }

      // If specific date provided, calculate day of week
      if (!dto.dayOfWeek) {
        const daysOfWeek = [
          DayOfWeek.Sunday,
          DayOfWeek.Monday,
          DayOfWeek.TuesDay,
          DayOfWeek.Wednesday,
          DayOfWeek.Thursday,
          DayOfWeek.Friday,
          DayOfWeek.Saturday,
        ];
        dayOfWeek = daysOfWeek[dateObj.getDay()];
      }
    }

    // Use provided day of week if specified
    if (dto.dayOfWeek) {
      dayOfWeek = dto.dayOfWeek as DayOfWeek;
    }

    // Handle time if provided
    if (dto.time) {
      const [hours, minutes] = dto.time.split(':').map(Number);
      if (isNaN(hours) || isNaN(minutes)) {
        throw new BadRequestException(
          'Invalid time format. Use HH:MM (24-hour format)',
        );
      }

      // Create date objects for the time
      const now = new Date();
      startTime = new Date(now);
      startTime.setHours(hours, minutes, 0, 0);

      // Assume default class duration is 1.5 hours if time is provided without a duration
      endTime = new Date(startTime);
      endTime.setMinutes(endTime.getMinutes() + 90);
    }

    // Build the query conditions based on what's provided
    const whereConditions: any = {};

    if (dayOfWeek) {
      whereConditions.dayOfWeek = dayOfWeek;
    }

    // If we have both start and end time, find classes that overlap with this period
    if (startTime && endTime) {
      whereConditions.startTime = LessThanOrEqual(endTime);
      whereConditions.endTime = MoreThanOrEqual(startTime);
    }

    // If a specific class ID is provided, exclude it from the search
    // (useful when checking if a room is available for a specific class to be updated)
    if (dto.notBookedFor) {
      whereConditions.id = Not(dto.notBookedFor);
    }

    // Only proceed if we have at least one filter condition
    if (Object.keys(whereConditions).length === 0) {
      return [];
    }

    // Find classes that match the conditions
    const bookedClasses = await this.classRoomRepository.find({
      where: whereConditions,
      select: ['roomId'],
    });

    // Extract unique room IDs
    return [...new Set(bookedClasses.map((c) => c.roomId))].filter(
      Boolean,
    ) as string[];
  }

  /**
   * Check if a room is available for a specific time slot
   * @param roomId the room to check
   * @param dayOfWeek day of the week
   * @param startTime start time
   * @param endTime end time
   * @param excludeClassId optional class ID to exclude from the check
   * @returns true if the room is available
   */
  async isRoomAvailable(
    roomId: string,
    dayOfWeek: DayOfWeek,
    startTime: Date,
    endTime: Date,
    excludeClassId?: string,
  ): Promise<boolean> {
    // Verify the room exists and is active
    const room = await this.getOneOrThrow({
      where: { id: roomId, status: 'ACTIVE' },
    });

    // Check if there are any overlapping classes
    const whereConditions: any = {
      roomId,
      dayOfWeek,
      startTime: LessThanOrEqual(endTime),
      endTime: MoreThanOrEqual(startTime),
    };

    // Exclude the current class if updating
    if (excludeClassId) {
      whereConditions.id = Not(excludeClassId);
    }

    const conflictingClasses = await this.classRoomRepository.count({
      where: whereConditions,
    });

    return conflictingClasses === 0;
  }

  /**
   * Get a room's availability schedule
   * @param id room ID
   * @returns schedule of bookings
   */
  async getRoomSchedule(id: string) {
    // Verify the room exists
    const room = await this.getOneOrThrow({
      where: { id },
    });

    // Get all classes scheduled in this room
    const classes = await this.classRoomRepository.find({
      where: { roomId: id },
      relations: {
        course: true,
        semester: true,
      },
    });

    // Organize by day of week
    const schedule: Record<string, any[]> = {
      MONDAY: [],
      TUESDAY: [],
      WEDNESDAY: [],
      THURSDAY: [],
      FRIDAY: [],
      SATURDAY: [],
      SUNDAY: [],
    };

    classes.forEach((classItem) => {
      if (classItem.dayOfWeek) {
        schedule[classItem.dayOfWeek].push({
          classId: classItem.id,
          name: classItem.name,
          courseName: classItem.course?.name,
          startTime: classItem.startTime,
          endTime: classItem.endTime,
          semesterName: classItem.semester?.name,
        });
      }
    });

    // Sort each day's schedule by start time
    Object.keys(schedule).forEach((day) => {
      schedule[day].sort((a, b) => {
        if (!a.startTime || !b.startTime) return 0;
        return a.startTime.getTime() - b.startTime.getTime();
      });
    });

    return {
      room,
      schedule,
    };
  }

  /**
   * Get analytics about room utilization
   * @returns utilization statistics
   */
  async getRoomUtilizationAnalytics() {
    // Get all active rooms
    const rooms = await this.roomRepository.find({
      where: { status: 'ACTIVE' },
    });

    // Get all classes with room assignments
    const classes = await this.classRoomRepository.find({
      relations: {
        room: true,
        enrollments: true,
      },
    });

    // Calculate stats
    const stats = {
      totalRooms: rooms.length,
      roomsByType: {} as Record<string, number>,
      mostUsedRooms: [] as any[],
      leastUsedRooms: [] as any[],
      averageOccupancyRate: 0,
    };

    // Count rooms by type
    rooms.forEach((room) => {
      if (room.roomType) {
        stats.roomsByType[room.roomType] =
          (stats.roomsByType[room.roomType] || 0) + 1;
      }
    });

    // Count classes per room and calculate occupancy
    const roomUsage = rooms.map((room) => {
      const roomClasses = classes.filter((c) => c.roomId === room.id);
      const totalEnrollments = roomClasses.reduce(
        (sum, c) => sum + (c.enrollments?.length || 0),
        0,
      );
      const maxCapacity = roomClasses.reduce(
        (sum, c) => sum + (room.capacity || 0),
        0,
      );

      const occupancyRate =
        maxCapacity > 0 ? (totalEnrollments / maxCapacity) * 100 : 0;

      return {
        id: room.id,
        name: room.name || room.roomNumber,
        building: room.building,
        classesCount: roomClasses.length,
        occupancyRate,
      };
    });

    // Sort by usage
    roomUsage.sort((a, b) => b.classesCount - a.classesCount);

    // Get most and least used
    stats.mostUsedRooms = roomUsage.slice(0, 5);
    stats.leastUsedRooms = [...roomUsage]
      .sort((a, b) => a.classesCount - b.classesCount)
      .slice(0, 5);

    // Calculate average occupancy
    stats.averageOccupancyRate =
      roomUsage.reduce((sum, room) => sum + room.occupancyRate, 0) /
      roomUsage.length;

    return stats;
  }
}
