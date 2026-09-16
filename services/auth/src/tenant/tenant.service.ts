import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TenantRepository } from './tenant.repository';
import { RoleService } from '../role/role.service';
import { UserService } from '../user/user.service';
import { CredentialService } from '../credential/credential.service';

@Injectable()
export class TenantService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenants: TenantRepository,
    private readonly roles: RoleService,
    private readonly users: UserService,
    private readonly credentials: CredentialService,
  ) {}

  // Tenant + first ADMIN user + credential are created atomically — a
  // partial write here would leave an unusable tenant with no way in.
  bootstrap(tenantName: string, adminEmail: string, adminPassword: string) {
    return this.prisma.$transaction(async (tx) => {
      const tenant = await this.tenants.create(tenantName, tx);
      const adminRole = await this.roles.ensure('ADMIN', tx);
      const adminUser = await this.users.create(tenant.id, adminEmail, adminRole.id, tx);
      await this.credentials.create(adminUser.id, adminPassword, tx);
      return { tenantId: tenant.id, adminUserId: adminUser.id };
    });
  }
}
