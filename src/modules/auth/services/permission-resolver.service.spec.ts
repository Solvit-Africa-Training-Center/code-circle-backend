import { Test } from '@nestjs/testing';
import { PermissionResolverService } from './permission-resolver.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UserRole } from '../entities/user-role.entity';
import { RolePermission } from '../entities/role-permission.entity';
import { UserPermission } from '../entities/user-permission.entity';
import { Repository } from 'typeorm';
import { scopeInterface } from '../enums/scope.enum';

describe('PermissionResolverService', () => {
  let service: PermissionResolverService;
  let userRoleRepo: jest.Mocked<Repository<UserRole>>;
  let rolePermRepo: jest.Mocked<Repository<RolePermission>>;
  let userPermRepo: jest.Mocked<Repository<UserPermission>>;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        PermissionResolverService,
        {
          provide: getRepositoryToken(UserRole),
          useValue: { 
            find: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(RolePermission),
          useValue: {
            createQueryBuilder: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(UserPermission),
          useValue: {
            createQueryBuilder: jest.fn(),
          },
        },
      ],
    }).compile();

    service = await moduleRef.resolve(PermissionResolverService);
    userRoleRepo = moduleRef.get(getRepositoryToken(UserRole));
    rolePermRepo = moduleRef.get(getRepositoryToken(RolePermission));
    userPermRepo = moduleRef.get(getRepositoryToken(UserPermission));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('returns empty array if user has no roles', async () => {
    userRoleRepo.find.mockResolvedValue([]);

    const userPermQbMock = {
      innerJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      getRawMany: jest.fn().mockResolvedValue([]),
    };
    userPermRepo.createQueryBuilder.mockReturnValue(userPermQbMock as any);

    const result = await service.resolveForUser('user-1');

    expect(userRoleRepo.find).toHaveBeenCalledWith({
      where: {
        user: { id: 'user-1' },
        role: { scope: scopeInterface.GLOBAL, isActive: true },
      },
      relations: ['role'],
    });
    expect(Array.from(result)).toEqual([]);
  });

  it('returns permissions from all user roles (deduplicated)', async () => {
    userRoleRepo.find.mockResolvedValue([
      { role: { id: 'role-1' } } as any,
      { role: { id: 'role-2' } } as any,
    ]);

    const rolePermQbMock = {
      innerJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      getRawMany: jest.fn().mockResolvedValue([
        { name: 'role.read' },
        { name: 'role.write' },
        { name: 'role.read' }, 
      ]),
    };
    rolePermRepo.createQueryBuilder.mockReturnValue(rolePermQbMock as any);

    const userPermGrantedQbMock = {
      innerJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      getRawMany: jest.fn().mockResolvedValue([]),
    };

    const userPermDeniedQbMock = {
      innerJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      getRawMany: jest.fn().mockResolvedValue([]),
    };

    userPermRepo.createQueryBuilder
      .mockReturnValueOnce(userPermGrantedQbMock as any)
      .mockReturnValueOnce(userPermDeniedQbMock as any);

    const result = await service.resolveForUser('user-1');

    expect(Array.from(result).sort()).toEqual(['role.read', 'role.write']);
  });
});