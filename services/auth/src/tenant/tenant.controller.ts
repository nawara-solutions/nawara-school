import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { TenantService } from './tenant.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { TenantBootstrapResponseDto } from './dto/tenant-bootstrap-response.dto';

// HTTP layer only — no ORM access here (CLAUDE.md §10).
@ApiTags('tenants')
@Controller('v1/tenants')
export class TenantController {
  constructor(private readonly tenantService: TenantService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Bootstrap a new tenant with its first ADMIN user' })
  @ApiResponse({ status: 201, type: TenantBootstrapResponseDto })
  async bootstrap(@Body() dto: CreateTenantDto): Promise<TenantBootstrapResponseDto> {
    return this.tenantService.bootstrap(dto.tenantName, dto.adminEmail, dto.adminPassword);
  }
}
