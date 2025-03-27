import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../typeorm/entities/user.entity';
import { JwtStrategy } from './strategies/jwt.strategy';
import { RolesGuard } from './guards/roles.guard';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  providers: [JwtStrategy, RolesGuard],
  exports: [JwtStrategy, RolesGuard, TypeOrmModule],
})
export class SharedModule {}
