import { SetMetadata } from '@nestjs/common';
import { UserRole } from 'src/typeorm/entities/user.entity';

/**
 * Key used to store roles metadata
 */
export const ROLES_KEY = 'roles';

/**
 * Decorator that specifies which roles are required to access a route
 * @param roles - Array of roles that can access the route
 */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
