import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { CredentialRepository } from './credential.repository';

const SALT_ROUNDS = 12;

@Injectable()
export class CredentialService {
  constructor(private readonly credentials: CredentialRepository) {}

  async create(userId: string, plaintextPassword: string, db?: Prisma.TransactionClient) {
    const passwordHash = await bcrypt.hash(plaintextPassword, SALT_ROUNDS);
    return this.credentials.create(userId, passwordHash, db);
  }

  verify(plaintextPassword: string, passwordHash: string): Promise<boolean> {
    return bcrypt.compare(plaintextPassword, passwordHash);
  }
}
