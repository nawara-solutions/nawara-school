import { Module } from '@nestjs/common';
import { HealthController } from './health/health.controller';
import { MetricsController } from './metrics/metrics.controller';
import { ClassroomController } from './classroom/classroom.controller';
import { ClassroomService } from './classroom/classroom.service';
import { ClassroomRepository } from './classroom/classroom.repository';
import { StaffAssignmentController } from './staff-assignment/staff-assignment.controller';
import { StaffAssignmentService } from './staff-assignment/staff-assignment.service';
import { StaffAssignmentRepository } from './staff-assignment/staff-assignment.repository';

// Capacity is a field on Classroom, not a separate module (CLAUDE.md §4).
@Module({
  controllers: [HealthController, MetricsController, ClassroomController, StaffAssignmentController],
  providers: [
    ClassroomService,
    ClassroomRepository,
    StaffAssignmentService,
    StaffAssignmentRepository,
  ],
})
export class AppModule {}
