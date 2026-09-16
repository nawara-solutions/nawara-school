import { Injectable } from '@nestjs/common';

// Sole writer of delivery-receipt (CLAUDE.md §4). Data access only, no business logic.
@Injectable()
export class DeliveryReceiptRepository {}
