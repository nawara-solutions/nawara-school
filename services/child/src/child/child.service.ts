import { Injectable } from '@nestjs/common';

// Business logic for child. Never imported by another service (CLAUDE.md §3).
@Injectable()
export class ChildService {}
