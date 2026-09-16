import { Module } from '@nestjs/common';
import { HealthController } from './health/health.controller';
import { MetricsController } from './metrics/metrics.controller';
import { AttendanceController } from './attendance/attendance.controller';
import { AttendanceService } from './attendance/attendance.service';
import { AttendanceRepository } from './attendance/attendance.repository';

// Append-only: corrections are new rows, never an UPDATE (CLAUDE.md §4).
@Module({
  controllers: [HealthController, MetricsController, AttendanceController],
  providers: [AttendanceService, AttendanceRepository],
})
export class AppModule {}
