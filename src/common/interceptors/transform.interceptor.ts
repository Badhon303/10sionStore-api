import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  data: T;
  timestamp: string;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<ApiResponse<T>> {
    const statusCode = context.switchToHttp().getResponse().statusCode;
    return next.handle().pipe(
      map((data) => {
        // Pass through already-shaped responses (e.g. raw file/gateway redirects)
        if (data && typeof data === 'object' && 'success' in data && 'statusCode' in data) {
          return data as unknown as ApiResponse<T>;
        }
        return {
          success: true,
          statusCode,
          data,
          timestamp: new Date().toISOString(),
        };
      }),
    );
  }
}
