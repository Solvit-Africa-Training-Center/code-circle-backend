import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('health')
@Controller()
export class AppController {
  @Get()
  @ApiOkResponse({ description: 'Root - simple welcome message' })
  root(): string {
    return 'Hello World!';
  }

  @Get('health')
  @ApiOkResponse({ description: 'Health check' })
  health() {
    return {
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    };
  }
}
