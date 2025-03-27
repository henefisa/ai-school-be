import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { Role } from 'src/shared/constants';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  username: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  password: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  email?: string;

  @IsOptional()
  @IsEnum(Role)
  role: Role;

  @IsOptional()
  @IsUUID(4)
  teacherId?: string;

  @IsOptional()
  @IsUUID(4)
  studentId?: string;

  @IsOptional()
  @IsString()
  photoUrl?: string;
}
