import { IsEmail, IsString, MinLength } from 'class-validator';

// Shape defined in packages/contracts/openapi/auth.yaml (CLAUDE.md §5.3).
export class CreateTenantDto {
  @IsString()
  @MinLength(2)
  tenantName!: string;

  @IsEmail()
  adminEmail!: string;

  @IsString()
  @MinLength(8)
  adminPassword!: string;
}
