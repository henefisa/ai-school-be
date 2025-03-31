import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Address } from 'src/typeorm/entities/address.entity';
import { ParentAddress } from 'src/typeorm/entities/parent-address.entity';
import { StudentAddress } from 'src/typeorm/entities/student-address.entity';
import { TeacherAddress } from 'src/typeorm/entities/teacher-address.entity';
import { AddressesService } from './addresses.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Address,
      ParentAddress,
      StudentAddress,
      TeacherAddress,
    ]),
  ],
  providers: [AddressesService],
  exports: [AddressesService],
})
export class AddressesModule {}
