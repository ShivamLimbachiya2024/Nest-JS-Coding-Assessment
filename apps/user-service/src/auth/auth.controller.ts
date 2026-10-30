import { Body, Controller, Post, Req, Res } from '@nestjs/common'
import { ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger'
import { TaskflowConfigService } from '@taskflow/config'
import type { Request, Response } from 'express'
import get from 'lodash/get.js'
import isString from 'lodash/isString.js'
import { LoginUserDto } from '../users/dto/login-user.dto.js'
import { RefreshResponseDto } from '../users/dto/refresh-response.dto.js'
import { RegisterUserDto } from '../users/dto/register-user.dto.js'
import { UserResponseDto } from '../users/dto/user-response.dto.js'
import { AuthService, IssuedSession } from './auth.service.js'

@Controller('users')
@ApiTags('users')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly config: TaskflowConfigService,
  ) {}

  @Post('register')
  @ApiCreatedResponse({ type: UserResponseDto })
  register(@Body() input: RegisterUserDto): Promise<UserResponseDto> {
    return this.auth.register(input)
  }

  @Post('login')
  @ApiOkResponse({ type: RefreshResponseDto })
  async login(
    @Body() input: LoginUserDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<RefreshResponseDto> {
    const issued = await this.auth.login(input)
    this.setCookies(response, issued)
    return new RefreshResponseDto(issued.user)
  }

  @Post('refresh')
  @ApiOkResponse({ type: RefreshResponseDto })
  async refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<RefreshResponseDto> {
    const token: unknown = get(request.cookies, this.config.refreshCookieName)
    const issued = await this.auth.refresh(
      isString(token) ? token : 'missing-refresh-token',
    )
    this.setCookies(response, issued)
    return new RefreshResponseDto(issued.user)
  }

  private setCookies(response: Response, issued: IssuedSession): void {
    const common = {
      domain: this.config.cookieDomain,
      httpOnly: true,
      sameSite: 'lax' as const,
      secure: this.config.isProduction,
    }
    response.cookie(this.config.accessCookieName, issued.accessToken, {
      ...common,
      path: '/',
      maxAge: this.config.accessTokenTtlSeconds * 1000,
    })
    response.cookie(this.config.refreshCookieName, issued.refreshToken, {
      ...common,
      path: '/users/refresh',
      maxAge: this.config.refreshTokenTtlSeconds * 1000,
    })
  }
}
