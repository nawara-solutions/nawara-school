import { Controller } from '@nestjs/common';

// HTTP layer only — no ORM access here (CLAUDE.md §10).
// TODO: define routes once packages/contracts/openapi has the notification contract.
@Controller('v1/notification')
export class NotificationController {}
