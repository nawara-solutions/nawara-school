import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

type Client = PrismaService | Prisma.TransactionClient;

@Injectable()
export class CredentialRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(userId: string, passwordHash: string, db: Client = this.prisma) {
    return db.credential.create({ data: { userId, passwordHash } });
  }
}
