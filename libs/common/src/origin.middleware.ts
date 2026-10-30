import { HttpStatus, Injectable, NestMiddleware } from '@nestjs/common'
import { TaskflowConfigService } from '@taskflow/config'
import { NextFunction, Request, Response } from 'express'
import includes from 'lodash/includes.js'
import isString from 'lodash/isString.js'
import { ApplicationError } from './application-error.js'
import { ErrorCode } from './error-code.enum.js'

enum HttpMethod {
  DELETE = 'DELETE',
  PATCH = 'PATCH',
  POST = 'POST',
  PUT = 'PUT',
}

@Injectable()
export class OriginMiddleware implements NestMiddleware {
  constructor(private readonly config: TaskflowConfigService) {}

  use(request: Request, _response: Response, next: NextFunction): void {
    const stateChangingMethods: readonly HttpMethod[] = [
      HttpMethod.DELETE,
      HttpMethod.PATCH,
      HttpMethod.POST,
      HttpMethod.PUT,
    ]

    if (!includes(stateChangingMethods, request.method)) {
      next()
      return
    }

    const origin = request.headers.origin

    if (!isString(origin) || !includes(this.config.corsOrigins, origin)) {
      throw new ApplicationError(
        ErrorCode.AUTHORIZATION_DENIED,
        HttpStatus.FORBIDDEN,
        'Request origin is not allowed',
      )
    }

    next()
  }
}
