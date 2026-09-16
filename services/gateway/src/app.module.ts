import { Module } from '@nestjs/common';
import { HealthController } from './health/health.controller';
import { MetricsController } from './metrics/metrics.controller';

// Routing, token validation, rate limiting. No domain entities live here.
@Module({
  controllers: [HealthController, MetricsController],
})
export class AppModule {}
