import { Controller, Get } from '@nestjs/common';

@Controller('metrics')
export class MetricsController {
  @Get()
  metrics() {
    // TODO: expose Prometheus-format metrics
  }
}
