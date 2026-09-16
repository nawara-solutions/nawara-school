import { Module } from '@nestjs/common';
import { HealthController } from './health/health.controller';
import { MetricsController } from './metrics/metrics.controller';
import { NotificationController } from './notification/notification.controller';
import { NotificationService } from './notification/notification.service';
import { NotificationRepository } from './notification/notification.repository';
import { TemplateController } from './template/template.controller';
import { TemplateService } from './template/template.service';
import { TemplateRepository } from './template/template.repository';
import { DeliveryReceiptService } from './delivery-receipt/delivery-receipt.service';
import { DeliveryReceiptRepository } from './delivery-receipt/delivery-receipt.repository';

// Templates are DB rows keyed by templateKey. This service never composes
// daycare copy — callers pass templateKey + a variables object (CLAUDE.md §5).
@Module({
  controllers: [HealthController, MetricsController, NotificationController, TemplateController],
  providers: [
    NotificationService,
    NotificationRepository,
    TemplateService,
    TemplateRepository,
    DeliveryReceiptService,
    DeliveryReceiptRepository,
  ],
})
export class AppModule {}
