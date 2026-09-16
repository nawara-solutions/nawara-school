import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

type Client = PrismaService | Prisma.TransactionClient;

// Sole writer of Tenant (CLAUDE.md §4). Data access only, no business logic.
@Injectable()
export class TenantRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(name: string, db: Client = this.prisma) {
    return db.tenant.create({ data: { name } });
  }
}
