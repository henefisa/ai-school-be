import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User, UserRole } from 'src/typeorm/entities/user.entity';
import { JwtAuthGuard } from 'src/shared/guards/jwt-auth.guard';
import { RolesGuard } from 'src/shared/guards/roles.guard';
import { Roles } from 'src/shared/decorators/roles.decorator';

/**
 * Controller responsible for handling user-related HTTP requests
 */
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * Creates a new user
   * @param createUserDto - Data transfer object containing user creation data
   * @returns Promise<User> - The created user
   */
  @Post()
  @Roles(UserRole.ADMIN)
  create(@Body() createUserDto: CreateUserDto): Promise<User> {
    return this.usersService.create(createUserDto);
  }

  /**
   * Retrieves all users, optionally filtered by role
   * @param role - Optional role to filter users by
   * @returns Promise<User[]> - Array of users
   */
  @Get()
  @Roles(UserRole.ADMIN)
  findAll(@Query('role') role?: UserRole): Promise<User[]> {
    return this.usersService.findAll(role);
  }

  /**
   * Retrieves all students
   * @returns Promise<User[]> - Array of students
   */
  @Get('students')
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  findAllStudents(): Promise<User[]> {
    return this.usersService.findByRole(UserRole.STUDENT);
  }

  /**
   * Retrieves all teachers
   * @returns Promise<User[]> - Array of teachers
   */
  @Get('teachers')
  @Roles(UserRole.ADMIN)
  findAllTeachers(): Promise<User[]> {
    return this.usersService.findByRole(UserRole.TEACHER);
  }

  /**
   * Retrieves all parents
   * @returns Promise<User[]> - Array of parents
   */
  @Get('parents')
  @Roles(UserRole.ADMIN)
  findAllParents(): Promise<User[]> {
    return this.usersService.findByRole(UserRole.PARENT);
  }

  /**
   * Retrieves a user by their ID
   * @param id - The user's ID
   * @returns Promise<User> - The found user
   */
  @Get(':id')
  @Roles(UserRole.ADMIN)
  findOne(@Param('id') id: string): Promise<User> {
    return this.usersService.findOne(id);
  }

  /**
   * Updates a user's information
   * @param id - The user's ID
   * @param updateUserDto - Data transfer object containing update data
   * @returns Promise<User> - The updated user
   */
  @Patch(':id')
  @Roles(UserRole.ADMIN)
  update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<User> {
    return this.usersService.update(id, updateUserDto);
  }

  /**
   * Removes a user from the system
   * @param id - The user's ID
   * @returns Promise<void>
   */
  @Delete(':id')
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string): Promise<void> {
    return this.usersService.remove(id);
  }
}
