import {
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common'
import { Request } from 'express'
import { AuthPrincipal } from './auth-principal.interface.js'

export const CurrentPrincipal = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthPrincipal => {
    const request = context.switchToHttp().getRequest<Request>()

    if (request.principal === undefined) {
      throw new UnauthorizedException('Authentication is required')
    }

    return request.principal
  },
)
