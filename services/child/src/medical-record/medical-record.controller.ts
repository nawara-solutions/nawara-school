import { Controller } from '@nestjs/common';

// HTTP layer only — no ORM access here (CLAUDE.md §10).
// TODO: define routes once packages/contracts/openapi has the medical-record contract.
@Controller('v1/medical-record')
export class MedicalRecordController {}
