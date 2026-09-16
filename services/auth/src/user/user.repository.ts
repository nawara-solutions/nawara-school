import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

type Client = PrismaService | Prisma.TransactionClient;

@Injectable()
export class UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(tenantId: string, email: string, roleId: string, db: Client = this.prisma) {
    return db.user.create({ data: { tenantId, email, roleId } });
  }

  // Login resolves by email alone, matching how the client presents
  // credentials; tenant is derived from the matched user, not supplied.
  findByEmail(email: string, db: Client = this.prisma) {
    return db.user.findFirst({
      where: { email },
      include: { credential: true, role: true },
    });
  }
}
