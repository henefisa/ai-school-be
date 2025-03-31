import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString } from 'class-validator';

export class LoginDto {
  @IsEmail()
  @ApiProperty({ example: 'admin@example.com' })
  email: string;

  @IsString()
  @ApiProperty({ example: 'admin123' })
  password: string;
}
