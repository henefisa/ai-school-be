import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { Address } from 'src/typeorm/entities/address.entity';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';
import { BaseService } from 'src/shared/base.service';
import { EntityName } from 'src/shared/error-messages';
import { ParentAddress } from 'src/typeorm/entities/parent-address.entity';
import { StudentAddress } from 'src/typeorm/entities/student-address.entity';
import { TeacherAddress } from 'src/typeorm/entities/teacher-address.entity';

@Injectable()
export class AddressesService extends BaseService<Address> {
  constructor(
    @InjectRepository(Address)
    private readonly addressRepository: Repository<Address>,
    @InjectRepository(ParentAddress)
    private readonly parentAddressRepository: Repository<ParentAddress>,
    @InjectRepository(StudentAddress)
    private readonly studentAddressRepository: Repository<StudentAddress>,
    @InjectRepository(TeacherAddress)
    private readonly teacherAddressRepository: Repository<TeacherAddress>,
  ) {
    super(EntityName.Address, addressRepository);
  }

  /**
   * Create a new address
   */
  async create(
    createAddressDto: CreateAddressDto,
    entityManager?: EntityManager,
  ): Promise<Address> {
    if (entityManager) {
      const address = entityManager.create(Address, createAddressDto);
      return await entityManager.save(Address, address);
    }

    const address = this.addressRepository.create(createAddressDto);
    return await this.addressRepository.save(address);
  }

  /**
   * Get an address by ID
   */
  async getById(id: string): Promise<Address> {
    return this.getOneOrThrow({
      where: { id },
    });
  }

  /**
   * Update an address
   */
  async update(
    id: string,
    updateAddressDto: UpdateAddressDto,
  ): Promise<Address> {
    const address = await this.getOneOrThrow({
      where: { id },
    });

    Object.assign(address, updateAddressDto);
    return await this.addressRepository.save(address);
  }

  /**
   * Associate an address with a parent
   */
  async associateWithParent(
    addressId: string,
    parentId: string,
    addressType: string = 'Primary',
    entityManager?: EntityManager,
  ): Promise<ParentAddress> {
    // Ensure address exists
    await this.getOneOrThrow(
      {
        where: { id: addressId },
      },
      entityManager,
    );

    const parentAddressData = {
      parentId,
      addressId,
      addressType,
    };

    if (entityManager) {
      const parentAddress = entityManager.create(
        ParentAddress,
        parentAddressData,
      );
      return await entityManager.save(ParentAddress, parentAddress);
    }

    const parentAddress =
      this.parentAddressRepository.create(parentAddressData);
    return await this.parentAddressRepository.save(parentAddress);
  }

  /**
   * Associate an address with a student
   */
  async associateWithStudent(
    addressId: string,
    studentId: string,
    addressType: string = 'Primary',
    entityManager?: EntityManager,
  ): Promise<StudentAddress> {
    // Ensure address exists
    await this.getOneOrThrow({
      where: { id: addressId },
    });

    const studentAddressData = {
      studentId,
      addressId,
      addressType,
    };

    if (entityManager) {
      const studentAddress = entityManager.create(
        StudentAddress,
        studentAddressData,
      );
      return await entityManager.save(StudentAddress, studentAddress);
    }

    const studentAddress =
      this.studentAddressRepository.create(studentAddressData);
    return await this.studentAddressRepository.save(studentAddress);
  }

  /**
   * Associate an address with a teacher
   */
  async associateWithTeacher(
    addressId: string,
    teacherId: string,
    addressType: string = 'Primary',
    entityManager?: EntityManager,
  ): Promise<TeacherAddress> {
    // Ensure address exists
    await this.getOneOrThrow(
      {
        where: { id: addressId },
      },
      entityManager,
    );

    const teacherAddressData = {
      teacherId,
      addressId,
      addressType,
    };

    if (entityManager) {
      const teacherAddress = entityManager.create(
        TeacherAddress,
        teacherAddressData,
      );

      return await entityManager.save(TeacherAddress, teacherAddress);
    }

    const teacherAddress =
      this.teacherAddressRepository.create(teacherAddressData);

    return await this.teacherAddressRepository.save(teacherAddress);
  }

  /**
   * Get addresses for a parent
   */
  async getAddressesForParent(parentId: string): Promise<Address[]> {
    const parentAddresses = await this.parentAddressRepository.find({
      where: { parentId },
      relations: ['address'],
    });

    return parentAddresses.map((pa) => pa.address);
  }

  /**
   * Get addresses for a student
   */
  async getAddressesForStudent(studentId: string): Promise<Address[]> {
    const studentAddresses = await this.studentAddressRepository.find({
      where: { studentId },
      relations: ['address'],
    });

    return studentAddresses.map((sa) => sa.address);
  }

  /**
   * Get addresses for a teacher
   */
  async getAddressesForTeacher(teacherId: string): Promise<Address[]> {
    const teacherAddresses = await this.teacherAddressRepository.find({
      where: { teacherId },
      relations: ['address'],
    });

    return teacherAddresses.map((ta) => ta.address);
  }

  /**
   * Delete an address
   */
  async delete(id: string): Promise<void> {
    await this.addressRepository.softDelete({ id });
  }
}
