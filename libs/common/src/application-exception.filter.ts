import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common'
import { StoryLogger } from '@taskflow/logger'
import { Request, Response } from 'express'
import { ApplicationError } from './application-error.js'
import { ErrorCode } from './error-code.enum.js'
import { RequestContext } from './request-context.js'

interface ErrorResponse {
  readonly code: ErrorCode
  readonly status: number
  readonly message: string
  readonly timestamp: string
  readonly path: string
  readonly correlationId: string
  readonly details?: Readonly<Record<string, readonly string[]>>
}

@Catch()
export class ApplicationExceptionFilter implements ExceptionFilter {
  constructor(
    private readonly context: RequestContext,
    private readonly logger: StoryLogger,
  ) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp()
    const request = http.getRequest<Request>()
    const response = http.getResponse<Response>()
    const mapped = this.map(exception)

    if (mapped.status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      const errorType = exception instanceof Error
        ? exception.name
        : 'UnknownFailure'
      this.logger.error(
        `HTTP operation failed correlationId=${this.context.correlationId} operation=${request.method}-${request.path} outcome=failed errorType=${errorType} errorCode=${mapped.code}`,
      )
    }

    const body: ErrorResponse = {
      ...mapped,
      timestamp: new Date().toISOString(),
      path: request.path,
      correlationId: this.context.correlationId,
    }

    response.status(mapped.status).json(body)
  }

  private map(
    exception: unknown,
  ): Pick<ErrorResponse, 'code' | 'status' | 'message' | 'details'> {
    if (exception instanceof ApplicationError) {
      return {
        code: exception.code,
        status: exception.status,
        message: exception.message,
        details: exception.details,
      }
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus()
      return {
        code: status === HttpStatus.BAD_REQUEST
          ? ErrorCode.VALIDATION_FAILED
          : ErrorCode.INTERNAL_ERROR,
        status,
        message: exception.message,
      }
    }

    return {
      code: ErrorCode.INTERNAL_ERROR,
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'An unexpected server error occurred',
    }
  }
}
