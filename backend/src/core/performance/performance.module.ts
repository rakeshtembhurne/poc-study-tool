import { Module, Global, DynamicModule } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { PerformanceInterceptor } from './performance.interceptor';
import { PerformanceService } from './performance.service';
import { MetricsController } from './metrics.controller';

export interface PerformanceModuleOptions {
  enableMetrics?: boolean;
  enableTracing?: boolean;
  slowQueryThreshold?: number; // milliseconds
  sampleRate?: number; // 0-1
}

@Global()
@Module({})
export class PerformanceModule {
  static forRoot(options: PerformanceModuleOptions = {}): DynamicModule {
    const providers: any[] = [
      PerformanceService,
      {
        provide: 'PERFORMANCE_OPTIONS',
        useValue: {
          enableMetrics: options.enableMetrics ?? true,
          enableTracing:
            options.enableTracing ?? process.env.NODE_ENV !== 'production',
          slowQueryThreshold: options.slowQueryThreshold ?? 100,
          sampleRate:
            options.sampleRate ??
            (process.env.NODE_ENV === 'production' ? 0.1 : 1),
        },
      },
    ];

    // Add interceptor if metrics are enabled
    if (options.enableMetrics !== false) {
      providers.push({
        provide: APP_INTERCEPTOR,
        useClass: PerformanceInterceptor,
      });
    }

    return {
      module: PerformanceModule,
      controllers: options.enableMetrics !== false ? [MetricsController] : [],
      providers,
      exports: [PerformanceService],
    };
  }
}
