import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { HealthController } from './health/health.controller';
import { MetricsController } from './metrics/metrics.controller';
import { PrismaService } from './prisma/prisma.service';
import { ConfigService } from './config/config.service';
import { TenantController } from './tenant/tenant.controller';
import { TenantService } from './tenant/tenant.service';
import { TenantRepository } from './tenant/tenant.repository';
import { UserController } from './user/user.controller';
import { UserService } from './user/user.service';
import { UserRepository } from './user/user.repository';
import { RoleController } from './role/role.controller';
import { RoleService } from './role/role.service';
import { RoleRepository } from './role/role.repository';
import { PermissionService } from './permission/permission.service';
import { PermissionRepository } from './permission/permission.repository';
import { SessionController } from './session/session.controller';
import { SessionService } from './session/session.service';
import { SessionRepository } from './session/session.repository';
import { CredentialService } from './credential/credential.service';
import { CredentialRepository } from './credential/credential.repository';

// Vocabulary limited to: tenant, user, role, permission, session (CLAUDE.md §5).
// Roles are seeded rows, not enums. Never a daycare concept in this service.
@Module({
  imports: [
    JwtModule.register({
      privateKey: readFileSync(resolve(process.env.JWT_PRIVATE_KEY_PATH ?? '')),
      publicKey: readFileSync(resolve(process.env.JWT_PUBLIC_KEY_PATH ?? '')),
      signOptions: {
        algorithm: 'RS256',
        expiresIn: Number(process.env.JWT_ACCESS_TOKEN_TTL_SECONDS ?? 900),
      },
    }),
  ],
  controllers: [
    HealthController,
    MetricsController,
    TenantController,
    UserController,
    RoleController,
    SessionController,
  ],
  providers: [
    PrismaService,
    ConfigService,
    TenantService,
    TenantRepository,
    UserService,
    UserRepository,
    RoleService,
    RoleRepository,
    PermissionService,
    PermissionRepository,
    SessionService,
    SessionRepository,
    CredentialService,
    CredentialRepository,
  ],
})
export class AppModule {}
