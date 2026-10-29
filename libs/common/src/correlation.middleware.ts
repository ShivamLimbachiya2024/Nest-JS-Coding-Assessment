import { Injectable, NestMiddleware } from '@nestjs/common'
import { isUUID } from 'class-validator'
import { NextFunction, Request, Response } from 'express'
import isString from 'lodash/isString.js'
import { randomUUID } from 'node:crypto'
import { RequestContext } from './request-context.js'

@Injectable()
export class CorrelationMiddleware implements NestMiddleware {
  constructor(private readonly context: RequestContext) {}

  use(request: Request, response: Response, next: NextFunction): void {
    const candidate = request.headers['x-correlation-id']
    const correlationId = isString(candidate) && isUUID(candidate)
      ? candidate
      : randomUUID()

    response.setHeader('x-correlation-id', correlationId)
    this.context.run(correlationId, next)
  }
}
