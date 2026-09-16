import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  // Liveness: no dependency checks, always fast (CLAUDE.md §9).
  @Get()
  liveness() {
    return { status: 'ok' };
  }

  // Readiness: checks DB + broker.
  @Get('ready')
  readiness() {
    // TODO: verify DB and RabbitMQ connectivity
    return { status: 'ok' };
  }
}
