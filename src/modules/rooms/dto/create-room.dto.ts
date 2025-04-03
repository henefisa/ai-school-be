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
  Min,
  ValidateNested,
} from 'class-validator';
import { RoomType } from 'src/shared/constants';
import { ApiProperty } from '@nestjs/swagger';

export class TimeSlot {
  @IsString()
  @ApiProperty({ example: '08:00' })
  start: string;

  @IsString()
  @ApiProperty({ example: '10:00' })
  end: string;
}

export class OperationalHours {
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => TimeSlot)
  @ApiProperty({
    type: () => TimeSlot,
    isArray: true,
    required: false,
    example: [
      { start: '08:00', end: '12:00' },
      { start: '13:00', end: '17:00' },
    ],
  })
  monday?: TimeSlot[];

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => TimeSlot)
  @ApiProperty({
    type: () => [TimeSlot],
    required: false,
    example: [
      { start: '08:00', end: '12:00' },
      { start: '13:00', end: '17:00' },
    ],
  })
  tuesday?: TimeSlot[];

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => TimeSlot)
  @ApiProperty({
    type: () => [TimeSlot],
    required: false,
    example: [
      { start: '08:00', end: '12:00' },
      { start: '13:00', end: '17:00' },
    ],
  })
  wednesday?: TimeSlot[];

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => TimeSlot)
  @ApiProperty({
    type: () => [TimeSlot],
    required: false,
    example: [
      { start: '08:00', end: '12:00' },
      { start: '13:00', end: '17:00' },
    ],
  })
  thursday?: TimeSlot[];

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => TimeSlot)
  @ApiProperty({
    type: () => [TimeSlot],
    required: false,
    example: [
      { start: '08:00', end: '12:00' },
      { start: '13:00', end: '17:00' },
    ],
  })
  friday?: TimeSlot[];

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => TimeSlot)
  @ApiProperty({
    type: () => [TimeSlot],
    required: false,
    example: [{ start: '08:00', end: '12:00' }],
  })
  saturday?: TimeSlot[];

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => TimeSlot)
  @ApiProperty({
    type: () => [TimeSlot],
    required: false,
    example: [],
  })
  sunday?: TimeSlot[];
}

export class CreateRoomDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: '101' })
  roomNumber: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: 'Main Building' })
  building: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: 'Main Lecture Hall' })
  name: string;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @ApiProperty({ example: 30, minimum: 1 })
  capacity: number;

  @IsEnum(RoomType)
  @ApiProperty({
    enum: RoomType,
    example: RoomType.ClassRoom,
  })
  roomType: RoomType;

  @IsBoolean()
  @IsOptional()
  @ApiProperty({
    example: true,
    required: false,
    default: true,
  })
  hasProjector?: boolean;

  @IsBoolean()
  @IsOptional()
  @ApiProperty({
    example: true,
    required: false,
    default: true,
  })
  hasWhiteboard?: boolean;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  @ApiProperty({
    type: [String],
    example: ['Smart Board', 'Air Conditioning', 'Audio System'],
    required: false,
  })
  features?: string[];

  @IsObject()
  @ValidateNested()
  @Type(() => OperationalHours)
  @IsOptional()
  @ApiProperty({
    type: () => OperationalHours,
    required: false,
  })
  operationalHours?: OperationalHours;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  @ApiProperty({
    example: 'ACTIVE',
    required: false,
    default: 'ACTIVE',
    enum: ['ACTIVE', 'INACTIVE', 'MAINTENANCE'],
  })
  status?: string;

  @IsString()
  @IsOptional()
  @ApiProperty({
    example: 'First floor, near the main entrance',
    required: false,
  })
  location?: string;

  @IsString()
  @IsOptional()
  @ApiProperty({
    example: 'This is a large lecture hall with tiered seating',
    required: false,
  })
  description?: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  @ApiProperty({
    example: 'Accessible by elevator, has emergency exit',
    required: false,
  })
  notes?: string;
}
