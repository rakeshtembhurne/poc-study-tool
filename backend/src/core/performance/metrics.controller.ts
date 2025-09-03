import { Controller, Get, Delete } from '@nestjs/common';
import { PerformanceService } from './performance.service';

@Controller('metrics')
export class MetricsController {
  constructor(private readonly performanceService: PerformanceService) {}

  @Get()
  getMetrics() {
    return {
      aggregated: this.performanceService.getMetrics(),
      system: this.performanceService.getSystemInfo(),
    };
  }

  @Get('recent')
  getRecentMetrics() {
    return this.performanceService.getRecentMetrics();
  }

  @Get('system')
  getSystemInfo() {
    return this.performanceService.getSystemInfo();
  }

  @Delete()
  clearMetrics() {
    this.performanceService.clearMetrics();
    return { message: 'Metrics cleared successfully' };
  }
}
