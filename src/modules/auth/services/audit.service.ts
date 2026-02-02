import { Injectable, Logger } from "@nestjs/common";
import { AuditLog } from "../entities/audit.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(
    @InjectRepository(AuditLog)
    private readonly auditLogRepo: Repository<AuditLog>,
  ) {}

  async log(
    action: string,
    actorId: string,
    targetId?: string,
    meta?: Record<string, any>,
  ): Promise<AuditLog | null> {
    try {
      const auditLog = this.auditLogRepo.create({
        action,
        actorId,
        targetId,
        meta,
      });

      return await this.auditLogRepo.save(auditLog);
    } catch (error) {
      this.logger.error(
        `Failed to log audit event: ${action}`,
        error.stack,
      );
      return null;
    }
  }

  async getLogsForActor(
    actorId: string,
    limit = 100,
  ): Promise<AuditLog[]> {
    return this.auditLogRepo.find({
      where: { actorId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async getLogsForTarget(
    targetId: string,
    limit = 100,
  ): Promise<AuditLog[]> {
    return this.auditLogRepo.find({
      where: { targetId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }
}