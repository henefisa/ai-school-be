import { ApiProperty, PartialType } from '@nestjs/swagger';
import { PaginationDto } from 'src/shared/dto';
import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { RoomType } from 'src/shared/constants';
import { Type } from 'class-transformer';

export class GetRoomsDto extends PartialType(PaginationDto) {
  @IsOptional()
  @IsString()
  @ApiProperty({
    required: false,
    description: 'Filter by room number',
    example: '101',
  })
  roomNumber?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    required: false,
    description: 'Filter by building',
    example: 'Main Building',
  })
  building?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    required: false,
    description: 'Filter by room name',
    example: 'Main Lecture Hall',
  })
  name?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @ApiProperty({
    required: false,
    description: 'Filter by minimum capacity',
    example: 20,
  })
  minCapacity?: number;

  @IsOptional()
  @IsEnum(RoomType)
  @ApiProperty({
    required: false,
    description: 'Filter by room type',
    enum: RoomType,
    example: RoomType.ClassRoom,
  })
  roomType?: RoomType;

  @IsOptional()
  @IsString()
  @ApiProperty({
    required: false,
    description: 'Filter by status',
    example: 'ACTIVE',
    enum: ['ACTIVE', 'INACTIVE', 'MAINTENANCE'],
  })
  status?: string;

  @IsOptional()
  @IsBoolean()
  @ApiProperty({
    required: false,
    description: 'Filter by projector availability',
    example: true,
  })
  hasProjector?: boolean;

  @IsOptional()
  @IsBoolean()
  @ApiProperty({
    required: false,
    description: 'Filter by whiteboard availability',
    example: true,
  })
  hasWhiteboard?: boolean;

  @IsOptional()
  @IsString()
  @ApiProperty({
    required: false,
    description: 'Filter by feature',
    example: 'Smart Board',
  })
  feature?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    required: false,
    description: 'Sort field',
    example: 'name',
  })
  sortBy?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    required: false,
    description: 'Sort order',
    enum: ['ASC', 'DESC'],
    example: 'ASC',
  })
  sortOrder?: 'ASC' | 'DESC';

  @IsOptional()
  @IsUUID(4)
  @ApiProperty({
    required: false,
    description:
      'Filter by availability (find rooms not booked for this class ID)',
    example: 'b85bd229-f5a9-459d-8887-69970ffeb500',
  })
  notBookedFor?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    required: false,
    description: 'Filter by date in ISO format (YYYY-MM-DD)',
    example: '2023-10-15',
  })
  date?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    required: false,
    description: 'Filter by time in 24-hour format (HH:MM)',
    example: '14:30',
  })
  time?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    required: false,
    description: 'Filter by day of week',
    example: 'MONDAY',
    enum: [
      'MONDAY',
      'TUESDAY',
      'WEDNESDAY',
      'THURSDAY',
      'FRIDAY',
      'SATURDAY',
      'SUNDAY',
    ],
  })
  dayOfWeek?: string;
}
