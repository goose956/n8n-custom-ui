import {
 Injectable,
 NestInterceptor,
 ExecutionContext,
 CallHandler,
 HttpException,
} from'@nestjs/common';
import { Observable, throwError } from'rxjs';
import { catchError, tap } from'rxjs/operators';
import { AnalyticsService } from'./analytics.service';

/**
 * Global interceptor that:
 * 1. Logs all unhandled errors to the error log
 * 2. Tracks API call durations for internal endpoints
 */
@Injectable()
export class ErrorLoggingInterceptor implements NestInterceptor {
 constructor(private readonly analyticsService: AnalyticsService) {}

 intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
 const request = context.switchToHttp().getRequest();
 const url = request.url ||'';
 const method = request.method ||'GET';
 const start = Date.now();

 return next.handle().pipe(
 catchError((error) => {
 const statusCode =
 error instanceof HttpException ? error.getStatus() : 500;
 const message =
 error instanceof Error ? error.message : String(error);

 // Don't log 404s or health checks
 if (statusCode !== 404 && !url.includes('/health')) {
 this.analyticsService.logError({
 source:'backend',
 severity: statusCode >= 500 ?'critical' :'error',
 message:`${method} ${url} -- ${message}`,
 endpoint:`${method} ${url}`,
 statusCode,
 stack: error instanceof Error ? error.stack : undefined,
 }).catch(() => { /* non-critical */ });
 }

 return throwError(() => error);
 }),
 );
 }
}
