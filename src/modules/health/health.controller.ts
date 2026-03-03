import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation } from '@nestjs/swagger';
import { HealthCheck, HealthCheckService } from '@nestjs/terminus';

@Controller('health')
export class HealthController {
  constructor(private readonly health: HealthCheckService) {}

  @ApiOperation({ summary: 'Health status endpoint' })
  @ApiOkResponse({
    description: 'Returns application and database health information.',
  })
  @Get()
  @HealthCheck()
  check() {
    return this.health.check([]);
  }
}
