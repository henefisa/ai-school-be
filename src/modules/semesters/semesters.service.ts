import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Not, Repository } from 'typeorm';
import { Semester } from 'src/typeorm/entities/semester.entity';
import { BaseService } from 'src/shared/base.service';
import { EntityName } from 'src/shared/error-messages';
import { GetSemestersDto } from './dto/get-semester.dto';
import { CreateSemesterDto } from './dto/create-semester.dto';
import { ExistsException } from 'src/shared/exceptions/exists.exception';
import { UpdateSemesterDto } from './dto/update-semester.dto';

@Injectable()
export class SemestersService extends BaseService<Semester> {
  constructor(
    @InjectRepository(Semester)
    private readonly semesterRepository: Repository<Semester>,
  ) {
    super(EntityName.Semester, semesterRepository);
  }

  async getSemesters(dto: GetSemestersDto) {
    const [results, count] = await this.semesterRepository.findAndCount({
      skip: (dto.page ?? 1 - 1) * (dto.pageSize ?? 10),
      take: dto.pageSize ?? 10,
    });

    return {
      results,
      count,
    };
  }

  async isNameAvailable(
    name: string,
    entityManager?: EntityManager,
    id?: string,
  ) {
    const semester = await this.getOne(
      {
        where: {
          name,
          ...(id && { id: Not(id) }),
        },
      },
      entityManager,
    );

    if (semester) {
      throw new ExistsException(EntityName.Semester);
    }

    return true;
  }

  async create(dto: CreateSemesterDto, entityManager?: EntityManager) {
    await this.isNameAvailable(dto.name);

    const manager = this.getRepository(entityManager);

    return manager.save({
      name: dto.name,
      startDate: dto.startDate,
      endDate: dto.endDate,
      currentSemester: dto.currentSemester,
    });
  }

  async update(id: string, dto: UpdateSemesterDto) {
    const semester = await this.getOneOrThrow({
      where: {
        id,
      },
    });

    if (dto.name) {
      await this.isNameAvailable(dto.name, undefined, id);
    }

    Object.assign(semester, dto);

    return this.semesterRepository.save(semester);
  }

  async delete(id: string) {
    await this.semesterRepository.delete({ id });
  }
}
