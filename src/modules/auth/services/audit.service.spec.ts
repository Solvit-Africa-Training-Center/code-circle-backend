import { Test, TestingModule } from '@nestjs/testing';
import { AuditService } from './audit.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AuditLog } from '../entities/audit.entity';
import { Repository } from 'typeorm';

describe('AuditService', () => {
  let service: AuditService;
  let auditLogRepo: jest.Mocked<Repository<AuditLog>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditService,
        {
          provide: getRepositoryToken(AuditLog),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuditService>(AuditService);
    auditLogRepo = module.get(getRepositoryToken(AuditLog));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('log', () => {
    it('should create and save an audit log entry', async () => {
      const mockAuditLog = {
        id: 'audit-1',
        action: 'USER_LOGIN',
        actorId: 'user-1',
        targetId: 'resource-1',
        meta: { ip: '192.168.1.1' },
        createdAt: new Date(),
      };

      auditLogRepo.create.mockReturnValue(mockAuditLog as any);
      auditLogRepo.save.mockResolvedValue(mockAuditLog as any);

      const result = await service.log(
        'USER_LOGIN',
        'user-1',
        'resource-1',
        { ip: '192.168.1.1' },
      );

      expect(auditLogRepo.create).toHaveBeenCalledWith({
        action: 'USER_LOGIN',
        actorId: 'user-1',
        targetId: 'resource-1',
        meta: { ip: '192.168.1.1' },
      });
      expect(auditLogRepo.save).toHaveBeenCalledWith(mockAuditLog);
      expect(result).toEqual(mockAuditLog);
    });

    it('should create audit log without targetId and meta', async () => {
      const mockAuditLog = {
        id: 'audit-2',
        action: 'SYSTEM_STARTUP',
        actorId: 'system',
        createdAt: new Date(),
      };

      auditLogRepo.create.mockReturnValue(mockAuditLog as any);
      auditLogRepo.save.mockResolvedValue(mockAuditLog as any);

      const result = await service.log('SYSTEM_STARTUP', 'system');

      expect(auditLogRepo.create).toHaveBeenCalledWith({
        action: 'SYSTEM_STARTUP',
        actorId: 'system',
        targetId: undefined,
        meta: undefined,
      });
      expect(result).toEqual(mockAuditLog);
    });

    it('should return null and log error if save fails', async () => {
      auditLogRepo.create.mockReturnValue({} as any);
      auditLogRepo.save.mockRejectedValue(new Error('Database error'));

      const result = await service.log('TEST_ACTION', 'user-1');

      expect(result).toBeNull();
    });
  });

  describe('getLogsForActor', () => {
    it('should return logs for a specific actor', async () => {
      const mockLogs = [
        { id: '1', action: 'LOGIN', actorId: 'user-1' },
        { id: '2', action: 'LOGOUT', actorId: 'user-1' },
      ];

      auditLogRepo.find.mockResolvedValue(mockLogs as any);

      const result = await service.getLogsForActor('user-1', 50);

      expect(auditLogRepo.find).toHaveBeenCalledWith({
        where: { actorId: 'user-1' },
        order: { createdAt: 'DESC' },
        take: 50,
      });
      expect(result).toEqual(mockLogs);
    });

    it('should use default limit of 100', async () => {
      auditLogRepo.find.mockResolvedValue([]);

      await service.getLogsForActor('user-1');

      expect(auditLogRepo.find).toHaveBeenCalledWith({
        where: { actorId: 'user-1' },
        order: { createdAt: 'DESC' },
        take: 100,
      });
    });
  });

  describe('getLogsForTarget', () => {
    it('should return logs for a specific target', async () => {
      const mockLogs = [
        { id: '1', action: 'UPDATE', targetId: 'resource-1' },
        { id: '2', action: 'DELETE', targetId: 'resource-1' },
      ];

      auditLogRepo.find.mockResolvedValue(mockLogs as any);

      const result = await service.getLogsForTarget('resource-1', 25);

      expect(auditLogRepo.find).toHaveBeenCalledWith({
        where: { targetId: 'resource-1' },
        order: { createdAt: 'DESC' },
        take: 25,
      });
      expect(result).toEqual(mockLogs);
    });
  });
});