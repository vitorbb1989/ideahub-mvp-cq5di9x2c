import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';

/**
 * Audit Interceptor
 *
 * Automatically populates audit fields (createdBy, updatedBy) based on the
 * authenticated user making the request.
 *
 * - POST requests: Sets both createdBy and updatedBy
 * - PATCH/PUT requests: Sets only updatedBy
 *
 * This interceptor should be applied globally or to specific controllers
 * that handle auditable entities (ideas, documents, prompts).
 */
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const userId = request.user?.id;

    // Only modify if we have a body and an authenticated user
    if (request.body && userId) {
      const method = request.method.toUpperCase();

      if (method === 'POST') {
        // New record - set both createdBy and updatedBy
        request.body.createdBy = userId;
        request.body.updatedBy = userId;
      } else if (method === 'PATCH' || method === 'PUT') {
        // Update - only set updatedBy
        request.body.updatedBy = userId;
      }
    }

    return next.handle();
  }
}
