import { performance } from 'perf_hooks';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import { RedisService } from '../../src/core/redis/redis.service';
// import { PrismaService } from '../../src/prisma/prisma.service';
import { ConfigService } from '../../src/core/config/config.service';

interface PerformanceMetric {
  operation: string;
  minTime: number;
  maxTime: number;
  avgTime: number;
  totalTime: number;
  iterations: number;
  memoryUsed: number;
}

class PerformanceAnalyzer {
  private metrics: Map<string, PerformanceMetric> = new Map();

  async measureOperation(
    name: string,
    operation: () => Promise<void>,
    iterations: number = 1000,
  ): Promise<PerformanceMetric> {
    const times: number[] = [];
    const initialMemory = process.memoryUsage().heapUsed;

    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      await operation();
      const end = performance.now();
      times.push(end - start);
    }

    const finalMemory = process.memoryUsage().heapUsed;
    const memoryUsed = finalMemory - initialMemory;

    const metric: PerformanceMetric = {
      operation: name,
      minTime: Math.min(...times),
      maxTime: Math.max(...times),
      avgTime: times.reduce((a, b) => a + b, 0) / times.length,
      totalTime: times.reduce((a, b) => a + b, 0),
      iterations,
      memoryUsed: memoryUsed / 1024 / 1024, // Convert to MB
    };

    this.metrics.set(name, metric);
    return metric;
  }

  generateReport(): string {
    let report = '# Performance Analysis Report\n\n';
    report += '## Summary\n\n';
    report +=
      '| Operation | Avg Time (ms) | Min Time (ms) | Max Time (ms) | Memory (MB) | Iterations |\n';
    report +=
      '|-----------|---------------|---------------|---------------|-------------|------------|\n';

    for (const [, metric] of this.metrics) {
      report += `| ${metric.operation} | ${metric.avgTime.toFixed(3)} | ${metric.minTime.toFixed(3)} | ${metric.maxTime.toFixed(3)} | ${metric.memoryUsed.toFixed(2)} | ${metric.iterations} |\n`;
    }

    report += '\n## Bottlenecks Identified\n\n';

    // Identify operations taking more than 10ms on average
    const slowOperations = Array.from(this.metrics.values())
      .filter((m) => m.avgTime > 10)
      .sort((a, b) => b.avgTime - a.avgTime);

    if (slowOperations.length > 0) {
      report += '### Slow Operations (>10ms avg)\n\n';
      slowOperations.forEach((op) => {
        report += `- **${op.operation}**: ${op.avgTime.toFixed(3)}ms average\n`;
      });
    }

    // Identify memory-intensive operations
    const memoryIntensive = Array.from(this.metrics.values())
      .filter((m) => m.memoryUsed > 10)
      .sort((a, b) => b.memoryUsed - a.memoryUsed);

    if (memoryIntensive.length > 0) {
      report += '\n### Memory Intensive Operations (>10MB)\n\n';
      memoryIntensive.forEach((op) => {
        report += `- **${op.operation}**: ${op.memoryUsed.toFixed(2)}MB\n`;
      });
    }

    return report;
  }
}

async function runPerformanceAnalysis() {
  console.log('Starting performance analysis...\n');

  const analyzer = new PerformanceAnalyzer();
  let app: TestingModule | undefined;
  let redisService: RedisService;
  // let prismaService: PrismaService;
  let configService: ConfigService;

  try {
    // Module initialization performance
    const moduleStart = performance.now();
    app = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    const moduleEnd = performance.now();

    console.log(
      `Module initialization: ${(moduleEnd - moduleStart).toFixed(2)}ms\n`,
    );

    redisService = app.get(RedisService);
    // prismaService = app.get(PrismaService); // Currently unused
    configService = app.get(ConfigService);

    // Redis Operations
    console.log('Testing Redis operations...');

    // Cache operations
    await analyzer.measureOperation('Redis: Cache Set', async () => {
      await redisService.set(`test-key-${Math.random()}`, { data: 'test' });
    });

    await analyzer.measureOperation('Redis: Cache Get', async () => {
      await redisService.get('test-key-1');
    });

    await analyzer.measureOperation('Redis: Cache Delete', async () => {
      await redisService.delete(`test-key-${Math.random()}`);
    });

    // Session operations
    const sessionData = {
      userId: 'user123',
      organizationId: 'org123',
      organizationType: 'ORG' as const,
      permissions: ['read', 'write'],
      createdAt: new Date(),
      lastActivity: new Date(),
    };

    await analyzer.measureOperation('Redis: Session Set', async () => {
      await redisService.setSession(
        `session-${Math.random()}`,
        sessionData,
        3600,
      );
    });

    await analyzer.measureOperation('Redis: Session Get', async () => {
      await redisService.getSession('session-1');
    });

    // Configuration operations
    console.log('Testing configuration operations...');

    await analyzer.measureOperation(
      'Config: Get Value',
      () => {
        configService.get('app.port');
        return Promise.resolve();
      },
      10000,
    );

    await analyzer.measureOperation(
      'Config: GetOrThrow',
      () => {
        configService.getOrThrow('app.port');
        return Promise.resolve();
      },
      10000,
    );

    // Generate report
    const report = analyzer.generateReport();
    console.log('\n' + report);

    // Additional analysis
    console.log('\n## Additional Performance Insights\n');

    // Redis connection pooling analysis
    const redisInfo = await redisService.info();
    const connectedClients =
      redisInfo.match(/connected_clients:(\d+)/)?.[1] || 'N/A';
    console.log(`Redis connected clients: ${connectedClients}`);

    // Memory usage
    const memUsage = process.memoryUsage();
    console.log(`\nMemory Usage:`);
    console.log(`- RSS: ${(memUsage.rss / 1024 / 1024).toFixed(2)} MB`);
    console.log(
      `- Heap Total: ${(memUsage.heapTotal / 1024 / 1024).toFixed(2)} MB`,
    );
    console.log(
      `- Heap Used: ${(memUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`,
    );
    console.log(
      `- External: ${(memUsage.external / 1024 / 1024).toFixed(2)} MB`,
    );
  } catch (error) {
    console.error('Performance analysis failed:', error);
  } finally {
    if (app) {
      await app.close();
    }
  }
}

// Run the analysis
runPerformanceAnalysis().catch(console.error);
