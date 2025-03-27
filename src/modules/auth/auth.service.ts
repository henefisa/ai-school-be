import { Injectable, UnauthorizedException } from '@nestjs/common';
import { LoginDto } from './dto';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthPayload } from 'src/@types';
import { UsersService } from '../users/users.service';
import { User } from 'src/typeorm/entities/user.entity';
import { InvalidCredentialsException } from 'src/shared/exceptions/invalid-credentials.exception';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.usersService
      .getOneOrThrow({
        where: { email: dto.email.toLowerCase() },
        select: {
          id: true,
          email: true,
          password: true,
          role: true,
        },
      })
      .catch(() => {
        throw new InvalidCredentialsException();
      });
    const isPasswordValid = await user.validatePassword(dto.password);

    if (!isPasswordValid) {
      throw new InvalidCredentialsException();
    }

    if (!user.isActive) {
      throw new UnauthorizedException('User is inactive');
    }

    const authPayload: AuthPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    return {
      accessToken: await this.jwtService.signAsync(authPayload),
      refreshToken: await this.jwtService.signAsync(authPayload, {
        secret: this.configService.getOrThrow('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.getOrThrow('JWT_REFRESH_EXPIRES_IN'),
      }),
    };
  }

  async refreshToken(user: User) {
    const authPayload: AuthPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    return {
      accessToken: await this.jwtService.signAsync(authPayload),
      refreshToken: await this.jwtService.signAsync(authPayload, {
        secret: this.configService.getOrThrow('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.getOrThrow('JWT_REFRESH_EXPIRES_IN'),
      }),
    };
  }
}
