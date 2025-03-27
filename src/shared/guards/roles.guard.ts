import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from 'src/typeorm/entities/user.entity';
import { RequestWithUser } from '../interfaces/request-with-user.interface';

/**
 * Guard that checks if the user has the required roles to access a route
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<UserRole[]>(
      'roles',
      context.getHandler(),
    );

    if (!requiredRoles) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const user = request.user as { role: UserRole };

    if (!user || !user.role) {
      return false;
    }

    return requiredRoles.includes(user.role);
  }
}
