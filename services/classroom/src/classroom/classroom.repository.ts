import { Injectable } from '@nestjs/common';

// Sole writer of classroom (CLAUDE.md §4). Data access only, no business logic.
@Injectable()
export class ClassroomRepository {}
