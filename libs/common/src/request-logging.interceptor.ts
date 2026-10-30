import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common'
import { StoryLogger } from 'logger'
import { Request } from 'express'
import { Observable, finalize } from 'rxjs'
import { RequestContext } from './request-context.js'

@Injectable()
export class RequestLoggingInterceptor implements NestInterceptor {
  constructor(
    private readonly requestContext: RequestContext,
    private readonly logger: StoryLogger,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>()
    const operation = `${request.method}-${request.path}`
    const startedAt = Date.now()

    this.logger.info(
      `HTTP operation started correlationId=${this.requestContext.correlationId} operation=${operation} outcome=started`,
    )

    return next.handle().pipe(
      finalize(() => {
        this.logger.info(
          `HTTP operation completed correlationId=${this.requestContext.correlationId} operation=${operation} outcome=completed durationMs=${Date.now() - startedAt}`,
        )
      }),
    )
  }
}
