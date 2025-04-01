import { applyDecorators, SetMetadata, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { Role } from '../constants';
import { RolesGuard } from '../guards/roles.guard';
import { ROLES_KEY } from './roles.decorator';

export function Auth(roles: Role[]) {
  return applyDecorators(
    SetMetadata(ROLES_KEY, roles),
    UseGuards(JwtAuthGuard, RolesGuard),
  );
}
