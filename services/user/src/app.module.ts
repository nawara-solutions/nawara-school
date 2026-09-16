import { Module } from '@nestjs/common';
import { HealthController } from './health/health.controller';
import { MetricsController } from './metrics/metrics.controller';
import { ProfileController } from './profile/profile.controller';
import { ProfileService } from './profile/profile.service';
import { ProfileRepository } from './profile/profile.repository';

// Owns Profile (name, contact, avatar) only. Auth holds no PII beyond
// identifiers (CLAUDE.md §4).
@Module({
  controllers: [HealthController, MetricsController, ProfileController],
  providers: [ProfileService, ProfileRepository],
})
export class AppModule {}
