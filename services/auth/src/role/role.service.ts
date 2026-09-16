import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { RoleRepository } from './role.repository';

@Injectable()
export class RoleService {
  constructor(private readonly roles: RoleRepository) {}

  ensure(name: string, db?: Prisma.TransactionClient) {
    return this.roles.findOrCreateByName(name, db);
  }
}
