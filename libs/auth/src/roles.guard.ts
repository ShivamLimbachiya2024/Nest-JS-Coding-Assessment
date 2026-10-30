import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { UserRole } from 'contracts'
import { Request } from 'express'
import includes from 'lodash/includes.js'
import { Roles } from './roles.decorator.js'

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const allowedRoles = this.reflector.getAllAndOverride(Roles, [
      context.getHandler(),
      context.getClass(),
    ])
    const request = context.switchToHttp().getRequest<Request>()

    if (allowedRoles === undefined || request.principal === undefined) {
      return false
    }

    return includes<UserRole>(allowedRoles, request.principal.role)
  }
}
