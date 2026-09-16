import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SessionService } from './session.service';
import { LoginDto } from './dto/login.dto';
import { LoginResponseDto } from './dto/login-response.dto';

// Grouped under v1/auth to match packages/contracts/openapi/auth.yaml
// (CLAUDE.md §5.3) — routes don't have to mirror the module folder name.
@ApiTags('auth')
@Controller('v1/auth')
export class SessionController {
  constructor(private readonly sessionService: SessionService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Authenticate with email + password and issue tokens' })
  @ApiResponse({ status: 200, type: LoginResponseDto })
  @ApiResponse({ status: 401, description: 'Invalid email or password' })
  login(@Body() dto: LoginDto): Promise<LoginResponseDto> {
    return this.sessionService.login(dto.email, dto.password);
  }
}
