import { Module } from '@nestjs/common';
import { HealthController } from './health/health.controller';
import { MetricsController } from './metrics/metrics.controller';
import { ChildController } from './child/child.controller';
import { ChildService } from './child/child.service';
import { ChildRepository } from './child/child.repository';
import { GuardianLinkController } from './guardian-link/guardian-link.controller';
import { GuardianLinkService } from './guardian-link/guardian-link.service';
import { GuardianLinkRepository } from './guardian-link/guardian-link.repository';
import { MedicalRecordController } from './medical-record/medical-record.controller';
import { MedicalRecordService } from './medical-record/medical-record.service';
import { MedicalRecordRepository } from './medical-record/medical-record.repository';
import { AllergyService } from './allergy/allergy.service';
import { AllergyRepository } from './allergy/allergy.repository';

// medical-record and allergy are a restricted column set: encrypted at rest
// under a separate key, reachable only through this service's medical
// endpoints, every read audited, never in a list/index response or event
// payload (CLAUDE.md §6.4).
@Module({
  controllers: [
    HealthController,
    MetricsController,
    ChildController,
    GuardianLinkController,
    MedicalRecordController,
  ],
  providers: [
    ChildService,
    ChildRepository,
    GuardianLinkService,
    GuardianLinkRepository,
    MedicalRecordService,
    MedicalRecordRepository,
    AllergyService,
    AllergyRepository,
  ],
})
export class AppModule {}
