import { Global, MiddlewareConsumer, Module, NestModule } from '@nestjs/common'
import { TaskflowLoggerModule } from '@taskflow/logger'
import { ApplicationExceptionFilter } from './application-exception.filter.js'
import { CorrelationMiddleware } from './correlation.middleware.js'
import { OriginMiddleware } from './origin.middleware.js'
import { RequestContext } from './request-context.js'
import { RequestLoggingInterceptor } from './request-logging.interceptor.js'

@Global()
@Module({
  imports: [TaskflowLoggerModule],
  providers: [
    ApplicationExceptionFilter,
    CorrelationMiddleware,
    OriginMiddleware,
    RequestContext,
    RequestLoggingInterceptor,
  ],
  exports: [
    ApplicationExceptionFilter,
    RequestContext,
    RequestLoggingInterceptor,
  ],
})
export class CommonModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(CorrelationMiddleware, OriginMiddleware).forRoutes('*')
  }
}
