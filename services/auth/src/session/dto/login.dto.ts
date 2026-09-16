import { IsEmail, IsString, MinLength } from 'class-validator';

// Shape defined in packages/contracts/openapi/auth.yaml (CLAUDE.md §5.3).
export class LoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;
}
