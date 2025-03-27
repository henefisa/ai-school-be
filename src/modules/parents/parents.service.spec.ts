import { Test, TestingModule } from '@nestjs/testing';
import { ParentsService } from './parents.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Parent } from 'src/typeorm/entities/parent.entity';
import { Student } from 'src/typeorm/entities/student.entity';

describe('ParentsService', () => {
  let service: ParentsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ParentsService,
        {
          provide: getRepositoryToken(Parent),
          useValue: {},
        },
        {
          provide: getRepositoryToken(Student),
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<ParentsService>(ParentsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
