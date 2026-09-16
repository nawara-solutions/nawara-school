import { Controller } from '@nestjs/common';

// HTTP layer only — no ORM access here (CLAUDE.md §10).
// TODO: define routes once packages/contracts/openapi has the guardian-link contract.
@Controller('v1/guardian-link')
export class GuardianLinkController {}
