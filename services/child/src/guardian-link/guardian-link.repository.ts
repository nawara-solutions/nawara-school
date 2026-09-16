import { Injectable } from '@nestjs/common';

// Sole writer of guardian-link (CLAUDE.md §4). Data access only, no business logic.
@Injectable()
export class GuardianLinkRepository {}
