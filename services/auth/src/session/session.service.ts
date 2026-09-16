import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { randomBytes, createHash } from 'crypto';
import { SessionRepository } from './session.repository';
import { UserService } from '../user/user.service';
import { CredentialService } from '../credential/credential.service';
import { ConfigService } from '../config/config.service';

@Injectable()
export class SessionService {
  constructor(
    private readonly sessions: SessionRepository,
    private readonly users: UserService,
    private readonly credentials: CredentialService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async login(email: string, password: string) {
    const user = await this.users.findByEmail(email);
    if (!user?.credential) {
      // Same message for "no such user" and "wrong password" — CLAUDE.md
      // §6.1/§6.2 spirit: never let a response leak which one it was.
      throw new UnauthorizedException('Invalid email or password.');
    }

    const valid = await this.credentials.verify(password, user.credential.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    const accessToken = this.jwt.sign({
      sub: user.id,
      tenantId: user.tenantId,
      role: user.role.name,
    });

    // Refresh token is opaque and stored only as a hash — never the raw
    // value — matching how passwords are handled (CLAUDE.md §6.10).
    const refreshToken = randomBytes(48).toString('hex');
    const refreshTokenHash = createHash('sha256').update(refreshToken).digest('hex');
    const ttlSeconds = this.config.get('JWT_REFRESH_TOKEN_TTL_SECONDS');
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000);

    await this.sessions.create(user.id, refreshTokenHash, expiresAt);

    return {
      accessToken,
      refreshToken,
      expiresIn: this.config.get('JWT_ACCESS_TOKEN_TTL_SECONDS'),
    };
  }
}
