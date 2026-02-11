import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { ClubService } from './club.service';
import { Club } from './entities/club.entity';
import { CreateClubDto } from './dto/create-club.dto';
import { Category } from '../categories/entities/category.entity';
import { User } from '../users/entities/user.entity';

type MockRepo<T extends object = any> = Partial<
  Record<keyof Repository<T>, jest.Mock>
>;

const createMockRepo = <T extends object = any>(): MockRepo<T> => ({
  findOne: jest.fn(),
  find: jest.fn(),
  findAndCount: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  preload: jest.fn(),
  delete: jest.fn(),
});

describe('ClubService', () => {
  let service: ClubService;
  let repo: MockRepo<Club>;
  let categoryRepo: MockRepo<Category>;
  let userRepo: MockRepo<User>;

  beforeEach(async () => {
    repo = createMockRepo<Club>();
    categoryRepo = createMockRepo<Category>();
    userRepo = createMockRepo<User>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClubService,
        { provide: getRepositoryToken(Club), useValue: repo },
        { provide: getRepositoryToken(Category), useValue: categoryRepo },
        { provide: getRepositoryToken(User), useValue: userRepo },
      ],
    }).compile();

    service = module.get<ClubService>(ClubService);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('creates a club', async () => {
    (repo.findOne as jest.Mock).mockResolvedValue(undefined);
    (categoryRepo.findOne as jest.Mock).mockResolvedValue({
      id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      isActive: true,
    });
    (userRepo.findOne as jest.Mock).mockResolvedValue({
      id: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
      isActive: true,
    });
    const dto: CreateClubDto = {
      name: 'a',
      description: 'd',
      categoryId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      creatorId: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
    };
    const created = { id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', ...dto } as Club;
    (repo.create as jest.Mock).mockReturnValue(created);
    (repo.save as jest.Mock).mockResolvedValue(created);

    const res = await service.create(dto);
    expect(repo.findOne).toHaveBeenCalledWith({ where: { name: dto.name } });
    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({ name: dto.name }),
    );
    expect(res).toEqual(created);
  });

  it('findAll returns paginated data', async () => {
    const rows = [{ id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', name: 'a' } as Club];
    (repo.findAndCount as jest.Mock).mockResolvedValue([rows, 1]);

    const res = await service.findAll({ page: 1, limit: 10 });
    expect(res.data).toHaveLength(1);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(res.meta.total).toBe(1);
  });

  it('findOne throws when not found', async () => {
    (repo.findOne as jest.Mock).mockResolvedValue(undefined);
    await expect(service.findOne('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11')).rejects.toThrow(NotFoundException);
  });

  it('findOne returns entity when found', async () => {
    const club = { id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', name: 'ok' } as Club;
    (repo.findOne as jest.Mock).mockResolvedValue(club);
    await expect(service.findOne('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11')).resolves.toEqual(club);
  });

  it('update throws when preload not found', async () => {
    (repo.preload as jest.Mock).mockResolvedValue(undefined);
    await expect(service.update('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', { name: 'x' })).rejects.toThrow(
      NotFoundException,
    );
  });

  it('update checks name uniqueness', async () => {
    const existing = { id: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', name: 'taken' } as Club;
    (repo.preload as jest.Mock).mockResolvedValue({
      id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      name: 'old',
    } as Club);
    (repo.findOne as jest.Mock).mockResolvedValue(existing);
    await expect(service.update('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', { name: 'taken' })).rejects.toThrow(
      ConflictException,
    );
  });

  it('remove throws when not found', async () => {
    (repo.delete as jest.Mock).mockResolvedValue({ affected: 0 });
    await expect(service.remove('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11')).rejects.toThrow(NotFoundException);
  });

  it('remove succeeds when affected', async () => {
    (repo.delete as jest.Mock).mockResolvedValue({ affected: 1 });
    await expect(service.remove('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11')).resolves.toBeUndefined();
  });
});
