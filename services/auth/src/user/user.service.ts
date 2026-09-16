import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { UserRepository } from './user.repository';

@Injectable()
export class UserService {
  constructor(private readonly users: UserRepository) {}

  create(tenantId: string, email: string, roleId: string, db?: Prisma.TransactionClient) {
    return this.users.create(tenantId, email, roleId, db);
  }

  findByEmail(email: string) {
    return this.users.findByEmail(email);
  }
}
