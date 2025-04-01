import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Parent } from 'src/typeorm/entities/parent.entity';
import { ParentsController } from './parents.controller';
import { ParentsService } from './parents.service';
import { Student } from 'src/typeorm/entities/student.entity';
import { EmergencyContact } from 'src/typeorm/entities/emergency-contact.entity';
import { AddressesModule } from '../addresses/addresses.module';
import { User } from 'src/typeorm/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Parent, Student, EmergencyContact, User]),
    AddressesModule,
  ],
  controllers: [ParentsController],
  providers: [ParentsService],
  exports: [ParentsService],
})
export class ParentsModule {}
