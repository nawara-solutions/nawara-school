import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

type Client = PrismaService | Prisma.TransactionClient;

@Injectable()
export class SessionRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(userId: string, refreshTokenHash: string, expiresAt: Date, db: Client = this.prisma) {
    return db.session.create({ data: { userId, refreshTokenHash, expiresAt } });
  }
}
