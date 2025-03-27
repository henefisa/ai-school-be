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

export class UpdateRoomDto {
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  roomNumber?: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  building?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  capacity?: number;

  @IsEnum(RoomType)
  @IsOptional()
  roomType?: RoomType;

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
