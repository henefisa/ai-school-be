import {
  Body,
  Controller,
  Get,
  Post,
  UseGuards,
  Request,
  Headers,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from 'src/shared/guards/jwt-auth.guard';
import { User } from 'src/typeorm/entities/user.entity';
import { RequestWithUser } from 'src/shared/interfaces/request-with-user.interface';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(
    @Body() registerDto: RegisterDto,
  ): Promise<Omit<User, 'password'>> {
    return this.authService.register(registerDto);
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto): Promise<{
    accessToken: string;
    refreshToken: string;
    user: Omit<User, 'password'>;
  }> {
    return this.authService.login(loginDto);
  }

  @Post('refresh')
  async refreshToken(
    @Headers('refresh-token') refreshToken: string,
  ): Promise<{ accessToken: string }> {
    return this.authService.refreshToken(refreshToken);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(@Request() req: RequestWithUser): Promise<void> {
    return this.authService.logout(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(
    @Request() req: RequestWithUser,
  ): Promise<Omit<User, 'password'>> {
    return this.authService.getProfile(req.user.id);
  }
}
