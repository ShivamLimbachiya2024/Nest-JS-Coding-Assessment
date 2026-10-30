import { Injectable, NestMiddleware } from '@nestjs/common'
import { isUUID } from 'class-validator'
import { NextFunction, Request, Response } from 'express'
import { StoryLogger } from 'logger'
import isString from 'lodash/isString.js'
import split from 'lodash/split.js'
import { randomUUID } from 'node:crypto'
import { RequestContext } from './request-context.js'

@Injectable()
export class CorrelationMiddleware implements NestMiddleware {
  constructor(
    private readonly context: RequestContext,
    private readonly logger: StoryLogger,
  ) {}

  use(request: Request, response: Response, next: NextFunction): void {
    const candidate = request.headers['x-correlation-id']
    const correlationId =
      isString(candidate) && isUUID(candidate) ? candidate : randomUUID()

    response.setHeader('x-correlation-id', correlationId)
    const startedAt = Date.now()
    const path = split(request.originalUrl, '?')[0] ?? '/'
    const operation = `${request.method}-${path}`

    this.context.run(correlationId, () => {
      this.logger.info(
        `HTTP request started correlationId=${correlationId} operation=${operation} outcome=started remoteIp=${request.ip}`,
      )

      response.once('finish', () => {
        const statusCode = response.statusCode
        const outcome = statusCode >= 400 ? 'failed' : 'completed'
        this.logger.info(
          `HTTP request ${outcome} correlationId=${correlationId} operation=${operation} outcome=${outcome} statusCode=${statusCode} remoteIp=${request.ip} durationMs=${Date.now() - startedAt}`,
        )
      })

      next()
    })
  }
}
