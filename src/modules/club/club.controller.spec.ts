import { Test, TestingModule } from '@nestjs/testing';
import { ClubController } from './club.controller';
import { ClubService } from './club.service';
import { CreateClubDto } from './dto/create-club.dto';

describe('ClubController', () => {
  let controller: ClubController;
  let service: Partial<Record<keyof ClubService, jest.Mock>>;

  beforeEach(async () => {
    service = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ClubController],
      providers: [{ provide: ClubService, useValue: service }],
    }).compile();

    controller = module.get<ClubController>(ClubController);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('findAll forwards query params to service', async () => {
    (service.findAll as jest.Mock).mockResolvedValue({ data: [], meta: {} });
    const res = await controller.findAll({ page: 2, limit: 5 });
    expect(service.findAll).toHaveBeenCalledWith({ page: 2, limit: 5 });
    expect(res.data).toEqual([]);
  });

  it('findOne parses id and calls service', async () => {
    (service.findOne as jest.Mock).mockResolvedValue({ id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', name: 'a' });
    const res = await controller.findOne('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11');
    expect(service.findOne).toHaveBeenCalledWith('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11');
    expect(res).toEqual({ id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', name: 'a' });
  });

  it('create delegates to service', async () => {
    const dto: CreateClubDto = { name: 'x' } as any;
    (service.create as jest.Mock).mockResolvedValue({ id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', ...dto });
    const res = await controller.create(dto, undefined as any);
    expect(service.create).toHaveBeenCalledWith(dto, undefined);
    expect(res).toEqual({ id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', ...dto });
  });

  it('update and remove delegate to service', async () => {
    (service.update as jest.Mock).mockResolvedValue({ id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', name: 'u' });
    (service.remove as jest.Mock).mockResolvedValue(undefined);

    await controller.update('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', { name: 'u' }, undefined as any);
    expect(service.update).toHaveBeenCalledWith('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', { name: 'u' }, undefined);

    await controller.remove('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11');
    expect(service.remove).toHaveBeenCalledWith('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11');
  });
});
