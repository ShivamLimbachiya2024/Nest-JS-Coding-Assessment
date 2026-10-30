import { Global, MiddlewareConsumer, Module, NestModule } from '@nestjs/common'
import { AppLoggerModule } from 'logger'
import { ApplicationExceptionFilter } from './application-exception.filter.js'
import { CorrelationMiddleware } from './correlation.middleware.js'
import { OriginMiddleware } from './origin.middleware.js'
import { RequestContext } from './request-context.js'

@Global()
@Module({
  imports: [AppLoggerModule],
  providers: [
    ApplicationExceptionFilter,
    CorrelationMiddleware,
    OriginMiddleware,
    RequestContext,
  ],
  exports: [ApplicationExceptionFilter, RequestContext],
})
export class CommonModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(CorrelationMiddleware, OriginMiddleware).forRoutes('*')
  }
}
