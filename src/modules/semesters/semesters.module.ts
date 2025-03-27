import { Module } from '@nestjs/common';
import { SemestersService } from './semesters.service';
import { SemestersController } from './semesters.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Semester } from 'src/typeorm/entities/semester.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Semester])],
  controllers: [SemestersController],
  providers: [SemestersService],
  exports: [SemestersService],
})
export class SemestersModule {}
