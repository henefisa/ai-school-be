import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { RoomType } from 'src/shared/constants';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateRoomDto {
  @ApiProperty({
    description: 'Room number identifier',
    example: 'A101',
  })
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  roomNumber?: string;

  @ApiProperty({
    description: 'Name of the room',
    example: 'Main Lecture Hall',
  })
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  name?: string;

  @ApiProperty({
    description: 'Building where the room is located',
    example: 'Science Building',
  })
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  building?: string;

  @ApiProperty({
    description: 'Exact location details',
    example: 'First floor, east wing',
  })
  @IsString()
  @IsOptional()
  location?: string;

  @ApiProperty({
    description: 'Room description',
    example: 'Large lecture hall with tiered seating',
  })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;

  @ApiProperty({
    description: 'Room capacity (number of people)',
    example: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  capacity?: number;

  @ApiProperty({
    description: 'Type of room',
    enum: RoomType,
    example: RoomType.ClassRoom,
  })
  @IsEnum(RoomType)
  @IsOptional()
  roomType?: RoomType;

  @ApiProperty({
    description: 'Whether the room has a projector',
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  hasProjector?: boolean;

  @ApiProperty({
    description: 'Whether the room has a whiteboard',
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  hasWhiteboard?: boolean;

  @ApiProperty({
    description: 'Room status (ACTIVE, MAINTENANCE, INACTIVE)',
    example: 'ACTIVE',
  })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiProperty({
    description: 'Additional features available in the room',
    example: ['Air conditioning', 'Smart board', 'Video conferencing'],
    type: [String],
  })
  @IsArray()
  @IsOptional()
  features?: string[];

  @ApiProperty({
    description: 'Operational hours for each day of the week',
    example: {
      MONDAY: [{ start: '08:00', end: '18:00' }],
      TUESDAY: [{ start: '08:00', end: '18:00' }],
    },
  })
  @IsObject()
  @IsOptional()
  operationalHours?: Record<string, { start: string; end: string }[]>;

  @ApiProperty({
    description: 'Additional notes about the room',
    example: 'Requires key card access after 6PM',
  })
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  notes?: string;
}
