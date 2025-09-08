import { Injectable, Inject } from '@nestjs/common';
import { performance } from 'perf_hooks';

export interface PerformanceMetric {
  name: string;
  duration: number;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

export interface AggregatedMetric {
  name: string;
  count: number;
  totalDuration: number;
  minDuration: number;
  maxDuration: number;
  avgDuration: number;
  p50: number;
  p95: number;
  p99: number;
}

@Injectable()
export class PerformanceService {
  private metrics: PerformanceMetric[] = [];
  private readonly maxMetrics = 10000;
  private readonly aggregationInterval = 60000; // 1 minute
  private lastAggregation = Date.now();
  private aggregatedMetrics = new Map<string, AggregatedMetric>();

  constructor(
    @Inject('PERFORMANCE_OPTIONS')
    private readonly options: {
      enableMetrics: boolean;
      enableTracing: boolean;
      slowQueryThreshold: number;
      sampleRate: number;
    }
  ) {}

  startTimer(): {
    end: (name: string, metadata?: Record<string, unknown>) => void;
  } {
    const start = performance.now();

    return {
      end: (name: string, metadata?: Record<string, unknown>) => {
        const duration = performance.now() - start;
        this.recordMetric(name, duration, metadata);
      },
    };
  }

  async measureAsync<T>(
    name: string,
    operation: () => Promise<T>,
    metadata?: Record<string, unknown>
  ): Promise<T> {
    const start = performance.now();
    try {
      const result = await operation();
      const duration = performance.now() - start;
      this.recordMetric(name, duration, metadata);
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      this.recordMetric(name, duration, { ...metadata, error: true });
      throw error;
    }
  }

  measure<T>(
    name: string,
    operation: () => T,
    metadata?: Record<string, unknown>
  ): T {
    const start = performance.now();
    try {
      const result = operation();
      const duration = performance.now() - start;
      this.recordMetric(name, duration, metadata);
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      this.recordMetric(name, duration, { ...metadata, error: true });
      throw error;
    }
  }

  private recordMetric(
    name: string,
    duration: number,
    metadata?: Record<string, unknown>
  ) {
    // Skip if metrics disabled
    if (!this.options.enableMetrics) return;

    // Apply sampling rate
    if (Math.random() > this.options.sampleRate) return;

    // Log slow operations
    if (duration > this.options.slowQueryThreshold) {
      console.warn(
        `Slow operation detected: ${name} took ${duration.toFixed(2)}ms`,
        metadata
      );
    }

    const metric: PerformanceMetric = {
      name,
      duration,
      timestamp: Date.now(),
      metadata,
    };

    // Add to metrics array (circular buffer)
    if (this.metrics.length >= this.maxMetrics) {
      this.metrics.shift();
    }
    this.metrics.push(metric);

    // Aggregate if needed
    if (Date.now() - this.lastAggregation > this.aggregationInterval) {
      this.aggregate();
    }
  }

  private aggregate() {
    const metricsByName = new Map<string, number[]>();

    // Group metrics by name
    for (const metric of this.metrics) {
      const durations = metricsByName.get(metric.name) || [];
      durations.push(metric.duration);
      metricsByName.set(metric.name, durations);
    }

    // Calculate aggregated metrics
    this.aggregatedMetrics.clear();
    for (const [name, durations] of metricsByName) {
      if (durations.length === 0) continue;

      // Sort for percentile calculations
      durations.sort((a, b) => a - b);

      const aggregated: AggregatedMetric = {
        name,
        count: durations.length,
        totalDuration: durations.reduce((sum, d) => sum + d, 0),
        minDuration: durations[0],
        maxDuration: durations[durations.length - 1],
        avgDuration:
          durations.reduce((sum, d) => sum + d, 0) / durations.length,
        p50: this.percentile(durations, 0.5),
        p95: this.percentile(durations, 0.95),
        p99: this.percentile(durations, 0.99),
      };

      this.aggregatedMetrics.set(name, aggregated);
    }

    // Clear old metrics
    const cutoffTime = Date.now() - this.aggregationInterval;
    this.metrics = this.metrics.filter((m) => m.timestamp > cutoffTime);
    this.lastAggregation = Date.now();
  }

  private percentile(sorted: number[], p: number): number {
    const index = Math.ceil(sorted.length * p) - 1;
    return sorted[Math.max(0, Math.min(index, sorted.length - 1))];
  }

  getMetrics(): AggregatedMetric[] {
    this.aggregate();
    return Array.from(this.aggregatedMetrics.values());
  }

  getMetric(name: string): AggregatedMetric | undefined {
    this.aggregate();
    return this.aggregatedMetrics.get(name);
  }

  getRecentMetrics(name?: string, limit: number = 100): PerformanceMetric[] {
    const filtered = name
      ? this.metrics.filter((m) => m.name === name)
      : this.metrics;

    return filtered.slice(-limit);
  }

  clearMetrics() {
    this.metrics = [];
    this.aggregatedMetrics.clear();
    this.lastAggregation = Date.now();
  }

  getMemoryUsage(): NodeJS.MemoryUsage {
    return process.memoryUsage();
  }

  getCpuUsage(): NodeJS.CpuUsage {
    return process.cpuUsage();
  }

  getSystemInfo() {
    const memUsage = this.getMemoryUsage();
    const cpuUsage = this.getCpuUsage();

    return {
      memory: {
        rss: `${(memUsage.rss / 1024 / 1024).toFixed(2)} MB`,
        heapTotal: `${(memUsage.heapTotal / 1024 / 1024).toFixed(2)} MB`,
        heapUsed: `${(memUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`,
        external: `${(memUsage.external / 1024 / 1024).toFixed(2)} MB`,
      },
      cpu: {
        user: `${(cpuUsage.user / 1000000).toFixed(2)}s`,
        system: `${(cpuUsage.system / 1000000).toFixed(2)}s`,
      },
      uptime: `${(process.uptime() / 60).toFixed(2)} minutes`,
      nodeVersion: process.version,
      platform: process.platform,
      metrics: {
        total: this.metrics.length,
        aggregated: this.aggregatedMetrics.size,
      },
    };
  }
}
