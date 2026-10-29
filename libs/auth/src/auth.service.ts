import { HttpStatus, Injectable } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { ApplicationError, ErrorCode } from '@taskflow/common'
import { TaskflowConfigService } from '@taskflow/config'
import { TokenType } from '@taskflow/contracts'
import { plainToInstance } from 'class-transformer'
import { validateSync } from 'class-validator'
import isEmpty from 'lodash/isEmpty.js'
import { AccessTokenPayload } from './access-token-payload.js'
import { RefreshTokenPayload } from './refresh-token-payload.js'

@Injectable()
export class AuthService {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: TaskflowConfigService,
  ) {}

  async verifyAccessToken(token: string): Promise<AccessTokenPayload> {
    try {
      const decoded = await this.jwt.verifyAsync<Record<string, unknown>>(token, {
        secret: this.config.accessTokenSecret,
        algorithms: ['HS256'],
        issuer: this.config.jwtIssuer,
        audience: this.config.jwtAudience,
      })
      const payload = plainToInstance(AccessTokenPayload, decoded, {
        excludeExtraneousValues: true,
      })

      if (!isEmpty(validateSync(payload)) || payload.type !== TokenType.ACCESS) {
        throw new Error('Access token claims failed validation')
      }

      return payload
    } catch {
      throw new ApplicationError(
        ErrorCode.AUTHENTICATION_REQUIRED,
        HttpStatus.UNAUTHORIZED,
        'Authentication is required',
      )
    }
  }

  async verifyRefreshToken(token: string): Promise<RefreshTokenPayload> {
    try {
      const decoded = await this.jwt.verifyAsync<Record<string, unknown>>(token, {
        secret: this.config.refreshTokenSecret,
        algorithms: ['HS256'],
        issuer: this.config.jwtIssuer,
        audience: this.config.jwtAudience,
      })
      const payload = plainToInstance(RefreshTokenPayload, decoded, {
        excludeExtraneousValues: true,
      })

      if (!isEmpty(validateSync(payload)) || payload.type !== TokenType.REFRESH) {
        throw new Error('Refresh token claims failed validation')
      }

      return payload
    } catch {
      throw new ApplicationError(
        ErrorCode.REFRESH_TOKEN_INVALID,
        HttpStatus.UNAUTHORIZED,
        'Refresh token is invalid',
      )
    }
  }
}
