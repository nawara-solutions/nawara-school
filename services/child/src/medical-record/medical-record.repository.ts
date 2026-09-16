import { Injectable } from '@nestjs/common';

// Sole writer of medical-record (CLAUDE.md §4). Data access only, no business logic.
@Injectable()
export class MedicalRecordRepository {}
