import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

type Client = PrismaService | Prisma.TransactionClient;

@Injectable()
export class RoleRepository {
  constructor(private readonly prisma: PrismaService) {}

  // Roles are seeded rows, not enums (CLAUDE.md §5) — upsert by name rather
  // than assuming a fixed set at compile time.
  findOrCreateByName(name: string, db: Client = this.prisma) {
    return db.role.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
}
