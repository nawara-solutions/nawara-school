import { Injectable } from '@nestjs/common';

// Sole writer of permission (CLAUDE.md §4). Data access only, no business logic.
@Injectable()
export class PermissionRepository {}
