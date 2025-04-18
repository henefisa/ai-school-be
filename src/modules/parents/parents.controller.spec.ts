import { Test, TestingModule } from '@nestjs/testing';
import { ParentsController } from './parents.controller';
import { ParentsService } from './parents.service';

describe('ParentsController', () => {
  let controller: ParentsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ParentsController],
      providers: [
        {
          provide: ParentsService,
          useValue: {},
        },
      ],
    }).compile();

    controller = module.get<ParentsController>(ParentsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
