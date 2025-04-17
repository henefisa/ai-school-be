import {
  Controller,
  FileTypeValidator,
  Get,
  MaxFileSizeValidator,
  ParseFilePipe,
  Patch,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { Request } from 'express';
import { JwtAuthGuard } from 'src/shared/guards/jwt-auth.guard';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { User } from 'src/typeorm/entities/user.entity';

@Controller({ path: 'users', version: '1' })
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@ApiTags('Users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  async getMe(@Req() req: Request) {
    // Assuming req.user contains the authenticated User object from JwtStrategy
    const userId = req.user.id;
    // Call service to get user with role-specific profile details
    return this.usersService.getProfile(userId);
  }

  @Patch('avatar')
  @UseInterceptors(FileInterceptor('avatar')) // Field name in form-data
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        avatar: {
          type: 'string',
          format: 'binary',
          description: 'User avatar image file (e.g., jpeg, png, gif)',
        },
      },
      required: ['avatar'],
    },
  })
  async updateMyAvatar(
    @Req() req: Request,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 2 * 1024 * 1024 }), // 2MB limit
          new FileTypeValidator({ fileType: /.(jpg|jpeg|png|gif)$/i }), // Image types
        ],
      }),
    )
    file: Express.Multer.File,
  ): Promise<User> {
    const userId = req.user.id; // Get user ID from authenticated request (assuming req.user is typed correctly)
    return this.usersService.updateAvatar(userId, file);
  }
}
