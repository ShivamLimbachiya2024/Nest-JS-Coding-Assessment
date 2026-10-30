import { HttpStatus, Injectable } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { InjectRepository } from '@nestjs/typeorm'
import { ApplicationError, ErrorCode, RequestContext } from 'common'
import { AppConfigService } from 'config'
import { TokenType } from 'contracts'
import { RefreshSessionEntity, UserEntity } from 'database/user-service'
import { StoryLogger } from 'logger'
import { hash, verify } from 'argon2'
import { createHash, randomUUID, timingSafeEqual } from 'node:crypto'
import { DataSource, IsNull, LessThanOrEqual, Repository } from 'typeorm'
import { AuthService as SharedAuthService } from 'auth'
import { LoginUserDto } from '../users/dto/login-user.dto.js'
import { RegisterUserDto } from '../users/dto/register-user.dto.js'
import { UserResponseDto } from '../users/dto/user-response.dto.js'
import { UsersService } from '../users/users.service.js'

export interface IssuedSession {
  readonly accessToken: string
  readonly refreshToken: string
  readonly user: UserResponseDto
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(RefreshSessionEntity)
    private readonly sessions: Repository<RefreshSessionEntity>,
    private readonly users: UsersService,
    private readonly jwt: JwtService,
    private readonly sharedAuth: SharedAuthService,
    private readonly config: AppConfigService,
    private readonly dataSource: DataSource,
    private readonly context: RequestContext,
    private readonly logger: StoryLogger,
  ) {}

  async register(input: RegisterUserDto): Promise<UserResponseDto> {
    const email = this.users.normalizeEmail(input.email)
    const existing = await this.users.findCredentials(email)

    if (existing !== null) {
      throw new ApplicationError(
        ErrorCode.EMAIL_CONFLICT,
        HttpStatus.CONFLICT,
        'A user with this email already exists',
      )
    }

    const passwordHash = await hash(input.password)
    const user = await this.users.create({
      name: input.name,
      email,
      passwordHash,
      role: input.role,
    })
    this.logger.info(
      `User registration completed correlationId=${this.context.correlationId} operation=register-user outcome=completed userId=${user.id}`,
    )
    return user
  }

  async login(input: LoginUserDto): Promise<IssuedSession> {
    const email = this.users.normalizeEmail(input.email)
    const user = await this.users.findCredentials(email)

    if (user === null || !(await verify(user.passwordHash, input.password))) {
      throw new ApplicationError(
        ErrorCode.INVALID_CREDENTIALS,
        HttpStatus.UNAUTHORIZED,
        'Email or password is invalid',
      )
    }

    const sessionId = randomUUID()
    const familyId = randomUUID()
    const issued = await this.issueTokens(user, sessionId, familyId)
    const session = this.sessions.create({
      id: sessionId,
      userId: user.id,
      familyId,
      tokenHash: this.hashToken(issued.refreshToken),
      expiresAt: new Date(
        Date.now() + this.config.refreshTokenTtlSeconds * 1000,
      ),
      revokedAt: null,
      replacedBySessionId: null,
    })
    await this.sessions.save(session)
    this.logger.info(
      `User login session committed correlationId=${this.context.correlationId} operation=login-user outcome=completed userId=${user.id} sessionId=${sessionId}`,
    )
    return issued
  }

  async refresh(refreshToken: string): Promise<IssuedSession> {
    const payload = await this.sharedAuth.verifyRefreshToken(refreshToken)
    const user = await this.users.getById(payload.sub)
    const newSessionId = randomUUID()
    const refreshJti = randomUUID()
    const newRefreshToken = await this.signRefreshToken(
      user.id,
      newSessionId,
      payload.familyId,
      refreshJti,
    )
    const newTokenHash = this.hashToken(newRefreshToken)
    const presentedHash = this.hashToken(refreshToken)
    const expiresAt = new Date(
      Date.now() + this.config.refreshTokenTtlSeconds * 1000,
    )

    const rotated = await this.dataSource.transaction(async (manager) => {
      const sessionRepository = manager.getRepository(RefreshSessionEntity)
      const session = await sessionRepository.findOne({
        where: { id: payload.sessionId, familyId: payload.familyId },
        lock: { mode: 'pessimistic_write' },
      })

      if (
        session === null ||
        session.revokedAt !== null ||
        session.expiresAt <= new Date() ||
        !this.hashesMatch(session.tokenHash, presentedHash)
      ) {
        await sessionRepository.update(
          { familyId: payload.familyId },
          { revokedAt: new Date() },
        )
        return false
      }

      session.revokedAt = new Date()
      session.replacedBySessionId = newSessionId
      const replacement = sessionRepository.create({
        id: newSessionId,
        userId: user.id,
        familyId: payload.familyId,
        tokenHash: newTokenHash,
        expiresAt,
        revokedAt: null,
        replacedBySessionId: null,
      })
      await sessionRepository.save([session, replacement])
      return true
    })

    if (!rotated) {
      throw new ApplicationError(
        ErrorCode.REFRESH_TOKEN_INVALID,
        HttpStatus.UNAUTHORIZED,
        'Refresh token is invalid',
      )
    }

    const accessToken = await this.signAccessToken(user)
    this.logger.info(
      `Refresh session rotated correlationId=${this.context.correlationId} operation=refresh-session outcome=completed userId=${user.id} sessionId=${newSessionId}`,
    )
    return { accessToken, refreshToken: newRefreshToken, user }
  }

  async revokeExpiredSessions(): Promise<void> {
    await this.sessions.update(
      { expiresAt: LessThanOrEqual(new Date()), revokedAt: IsNull() },
      { revokedAt: new Date() },
    )
  }

  private async issueTokens(
    user: UserEntity,
    sessionId: string,
    familyId: string,
  ): Promise<IssuedSession> {
    const refreshJti = randomUUID()
    const [accessToken, refreshToken] = await Promise.all([
      this.signAccessToken(new UserResponseDto(user)),
      this.signRefreshToken(user.id, sessionId, familyId, refreshJti),
    ])
    return {
      accessToken,
      refreshToken,
      user: new UserResponseDto(user),
    }
  }

  private signAccessToken(user: UserResponseDto): Promise<string> {
    return this.jwt.signAsync(
      {
        sub: user.id,
        userId: user.id,
        email: user.email,
        role: user.role,
        type: TokenType.ACCESS,
      },
      {
        secret: this.config.accessTokenSecret,
        algorithm: 'HS256',
        issuer: this.config.jwtIssuer,
        audience: this.config.jwtAudience,
        expiresIn: this.config.accessTokenTtlSeconds,
        jwtid: randomUUID(),
      },
    )
  }

  private signRefreshToken(
    userId: string,
    sessionId: string,
    familyId: string,
    jti: string,
  ): Promise<string> {
    return this.jwt.signAsync(
      {
        sub: userId,
        sessionId,
        familyId,
        type: TokenType.REFRESH,
      },
      {
        secret: this.config.refreshTokenSecret,
        algorithm: 'HS256',
        issuer: this.config.jwtIssuer,
        audience: this.config.jwtAudience,
        expiresIn: this.config.refreshTokenTtlSeconds,
        jwtid: jti,
      },
    )
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex')
  }

  private hashesMatch(left: string, right: string): boolean {
    return timingSafeEqual(Buffer.from(left), Buffer.from(right))
  }
}
