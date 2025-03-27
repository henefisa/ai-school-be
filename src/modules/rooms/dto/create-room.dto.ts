import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { RoomType } from 'src/shared/constants';

export class CreateRoomDto {
  @IsString()
  @IsNotEmpty()
  roomNumber: string;

  @IsString()
  @IsNotEmpty()
  building: string;

  @Type(() => Number)
  @IsNumber()
  capacity: number;

  @IsEnum(RoomType)
  roomType: RoomType;

  @IsBoolean()
  @IsOptional()
  hasProjector?: boolean;

  @IsBoolean()
  @IsOptional()
  hasWhiteboard?: boolean;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  notes?: string;
}
