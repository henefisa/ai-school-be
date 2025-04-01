import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Parent } from 'src/typeorm/entities/parent.entity';
import { EntityManager, Repository } from 'typeorm';
import { CreateParentDto } from './dto/create-parent.dto';
import { UpdateParentDto } from './dto/update-parent.dto';
import { GetParentsDto } from './dto/get-parents.dto';
import { BaseService } from 'src/shared/base.service';
import { EntityName } from 'src/shared/error-messages';
import { Student } from 'src/typeorm/entities/student.entity';
import { EmergencyContact } from 'src/typeorm/entities/emergency-contact.entity';
import { AddressesService } from '../addresses/addresses.service';
import { CreateAddressDto } from '../addresses/dto/create-address.dto';
import { ParentAddress } from 'src/typeorm/entities/parent-address.entity';
import { Address } from 'src/typeorm/entities/address.entity';
import { User } from 'src/typeorm/entities/user.entity';
import { Role } from 'src/shared/constants';
import * as argon2 from 'argon2';

@Injectable()
export class ParentsService extends BaseService<Parent> {
  constructor(
    @InjectRepository(Parent)
    private readonly parentRepository: Repository<Parent>,
    @InjectRepository(Student)
    private readonly studentRepository: Repository<Student>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly addressesService: AddressesService,
  ) {
    super(EntityName.Parent, parentRepository);
  }

  async create(createParentDto: CreateParentDto): Promise<Parent> {
    return this.parentRepository.manager.transaction(async (entityManager) => {
      // Create parent record
      const parentData: Partial<Parent> = {
        firstName: createParentDto.personal.firstName,
        lastName: createParentDto.personal.lastName,
        occupation: createParentDto.personal.occupation,
        email: createParentDto.contact.email,
        contactNumber1: createParentDto.contact.phoneNumber,
        notes: createParentDto.notes,
      };

      const parent = entityManager.create(Parent, parentData);
      const savedParent = await entityManager.save(Parent, parent);

      // Create user account for parent
      const username = createParentDto.personal.username;

      const hashedPassword = await argon2.hash(
        createParentDto.personal.password,
      );

      const user = entityManager.create(User, {
        email: createParentDto.contact.email,
        username,
        password: hashedPassword,
        role: Role.Parent,
        isActive: true,
        parentId: savedParent.id,
      });

      const savedUser = await entityManager.save(User, user);

      // Update parent with user reference (if needed)
      savedParent.user = savedUser;
      await entityManager.save(Parent, savedParent);

      // Create address - address is required
      const addressDto: CreateAddressDto = {
        street: createParentDto.contact.street,
        city: createParentDto.contact.city,
        state: createParentDto.contact.state,
        zipCode: createParentDto.contact.zipCode,
        country: createParentDto.contact.country,
      };

      const savedAddress = await this.addressesService.create(
        addressDto,
        entityManager,
      );

      // Associate address with parent
      await this.addressesService.associateWithParent(
        savedAddress.id,
        savedParent.id,
        'Primary',
        entityManager,
      );

      // Create emergency contacts
      const emergencyContactPromises = createParentDto.emergencyContacts.map(
        (contactDto) => {
          const emergencyContact = entityManager.create(EmergencyContact, {
            ...contactDto,
            parentId: savedParent.id,
          });

          return entityManager.save(EmergencyContact, emergencyContact);
        },
      );

      await Promise.all(emergencyContactPromises);

      return this.getParentById(savedParent.id, entityManager);
    });
  }

  async getParents(dto: GetParentsDto) {
    const queryBuilder = this.parentRepository
      .createQueryBuilder('parent')
      .innerJoinAndSelect('parent.user', 'user');

    // Apply search filter if query parameter exists
    if (dto.q) {
      queryBuilder.where(
        '(parent.first_name ILIKE :query OR parent.last_name ILIKE :query OR parent.email ILIKE :query)',
        { query: `%${dto.q}%` },
      );
    }

    // Join with User to get status information
    if (dto.status !== undefined) {
      queryBuilder.andWhere('user.is_active = :status', {
        status: dto.status,
      });
    }

    // Apply pagination
    queryBuilder
      .skip(dto.skip)
      .take(dto.pageSize || 10)
      .orderBy('parent.created_at', 'DESC');

    const [results, count] = await queryBuilder.getManyAndCount();

    return {
      results,
      count,
    };
  }

  async getParentById(
    id: string,
    entityManager?: EntityManager,
  ): Promise<Parent> {
    return this.getOneOrThrow(
      {
        where: { id },
        relations: {
          parentAddresses: {
            address: true,
          },
          emergencyContacts: true,
        },
      },
      entityManager,
    );
  }

  async getChildrenByParentId(id: string): Promise<Student[]> {
    // First verify that the parent exists
    await this.getOneOrThrow({
      where: { id },
    });

    // Then find all children associated with this parent using query builder
    return this.studentRepository
      .createQueryBuilder('student')
      .leftJoinAndSelect('student.user', 'user')
      .where('student.parent_id = :parentId', { parentId: id })
      .getMany();
  }

  async update(id: string, updateParentDto: UpdateParentDto): Promise<Parent> {
    return this.parentRepository.manager.transaction(async (entityManager) => {
      // Find parent with related entities
      const parent = await this.getOneOrThrow(
        {
          where: { id },
          relations: {
            parentAddresses: {
              address: true,
            },
            emergencyContacts: true,
            user: true,
          },
        },
        entityManager,
      );

      // Update parent record
      const parentData: Partial<Parent> = {};

      // Update personal information if provided
      if (updateParentDto.personal) {
        const { firstName, lastName, occupation } = updateParentDto.personal;
        Object.assign(parentData, {
          ...(firstName && { firstName }),
          ...(lastName && { lastName }),
          ...(occupation && { occupation }),
        });
      }

      // Update contact information if provided
      if (updateParentDto.contact) {
        const { email, phoneNumber } = updateParentDto.contact;
        Object.assign(parentData, {
          ...(email && { email }),
          ...(phoneNumber && { contactNumber1: phoneNumber }),
        });
      }

      // Update notes if provided
      if (updateParentDto.notes !== undefined) {
        parentData.notes = updateParentDto.notes;
      }

      // Apply parent updates
      Object.assign(parent, parentData);
      const updatedParent = await entityManager.save(Parent, parent);

      // Update user information if username or password provided
      if (
        parent.user &&
        updateParentDto.personal &&
        (updateParentDto.personal.username || updateParentDto.personal.password)
      ) {
        const userData: Partial<User> = {};

        if (updateParentDto.personal.username) {
          userData.username = updateParentDto.personal.username;
        }

        if (updateParentDto.personal.password) {
          userData.password = await argon2.hash(
            updateParentDto.personal.password,
          );
        }

        // If email is updated, also update it on the user account
        if (updateParentDto.contact?.email) {
          userData.email = updateParentDto.contact.email;
        }

        // Apply user updates
        await entityManager.update(User, { id: parent.user.id }, userData);
      }

      // Update emergency contacts if provided
      if (Array.isArray(updateParentDto.emergencyContacts)) {
        // Validate emergency contacts - at least one is required for update too
        if (updateParentDto.emergencyContacts.length === 0) {
          throw new BadRequestException(
            'At least one emergency contact is required',
          );
        }

        // Delete existing emergency contacts
        if (parent.emergencyContacts && parent.emergencyContacts.length > 0) {
          await entityManager.delete(EmergencyContact, {
            parentId: parent.id,
          });
        }

        // Create new emergency contacts with Promise.all for better performance
        const emergencyContactPromises = updateParentDto.emergencyContacts.map(
          (contactDto) => {
            const emergencyContact = entityManager.create(EmergencyContact, {
              ...contactDto,
              parentId: parent.id,
            });
            return entityManager.save(EmergencyContact, emergencyContact);
          },
        );

        await Promise.all(emergencyContactPromises);
      }

      return this.getParentById(updatedParent.id);
    });
  }

  async delete(id: string): Promise<void> {
    return this.parentRepository.manager.transaction(async (entityManager) => {
      // Get parent with related entities
      const parent = await this.getOneOrThrow(
        {
          where: { id },
          relations: {
            parentAddresses: {
              address: true,
            },
            emergencyContacts: true,
            user: true,
          },
        },
        entityManager,
      );

      // Delete emergency contacts
      if (parent.emergencyContacts && parent.emergencyContacts.length > 0) {
        await entityManager.softDelete(EmergencyContact, { parentId: id });
      }

      // Delete parent-address relationships
      if (parent.parentAddresses && parent.parentAddresses.length > 0) {
        // Get address IDs
        const addressIds = parent.parentAddresses.map((pa) => pa.address.id);

        // Delete parent-address relationships
        for (const pa of parent.parentAddresses) {
          await entityManager.softDelete(ParentAddress, { id: pa.id });
        }

        // Check if any addresses can be deleted (not used by other entities)
        for (const addressId of addressIds) {
          interface AddressExistsResult {
            exists: boolean;
          }

          const addressUsed = await entityManager.query<AddressExistsResult[]>(
            `
            SELECT EXISTS(
              SELECT 1 FROM parent_addresses 
              WHERE address_id = $1 AND deleted_at IS NULL
              UNION
              SELECT 1 FROM student_addresses 
              WHERE address_id = $1 AND deleted_at IS NULL
              UNION
              SELECT 1 FROM teacher_addresses 
              WHERE address_id = $1 AND deleted_at IS NULL
            )
            `,
            [addressId],
          );

          if (!addressUsed[0].exists) {
            await entityManager.softDelete(Address, { id: addressId });
          }
        }
      }

      // Soft delete the associated user account if it exists
      if (parent.user) {
        await entityManager.softDelete(User, { id: parent.user.id });
      }

      // Finally, delete the parent
      await entityManager.softDelete(Parent, { id });
    });
  }
}
