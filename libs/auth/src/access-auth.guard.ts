import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common'
import { AppConfigService } from 'config'
import { Request } from 'express'
import get from 'lodash/get.js'
import isString from 'lodash/isString.js'
import { AuthService } from './auth.service.js'

@Injectable()
export class AccessAuthGuard implements CanActivate {
  constructor(
    private readonly auth: AuthService,
    private readonly config: AppConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>()
    const token: unknown = get(request.cookies, this.config.accessCookieName)

    if (!isString(token)) {
      await this.auth.verifyAccessToken('missing-access-token')
      return false
    }

    const payload = await this.auth.verifyAccessToken(token)
    request.principal = {
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
    }

    return true
  }
}
