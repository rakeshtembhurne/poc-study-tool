import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { PerformanceService } from './performance.service';
import { Request } from 'express';

@Injectable()
export class PerformanceInterceptor implements NestInterceptor {
  constructor(private readonly performanceService: PerformanceService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();
    const timer = this.performanceService.startTimer();

    const metadata = {
      method: request.method,
      path: request.path,
      userAgent: request.headers['user-agent'],
      ip: request.ip,
    };

    return next.handle().pipe(
      tap({
        next: () => {
          timer.end(`http_request`, {
            ...metadata,
            statusCode: context
              .switchToHttp()
              .getResponse<{ statusCode: number }>().statusCode,
          });
        },
        error: (error: any) => {
          timer.end(`http_request`, {
            ...metadata,
            statusCode: (error as { status?: number }).status || 500,
            error: true,
          });
        },
      })
    );
  }
}
