import { Injectable } from '@nestjs/common'
import { config as loadEnvironmentFile } from 'dotenv'
import compact from 'lodash/compact.js'
import isFinite from 'lodash/isFinite.js'
import map from 'lodash/map.js'
import split from 'lodash/split.js'
import toNumber from 'lodash/toNumber.js'
import trim from 'lodash/trim.js'
import uniq from 'lodash/uniq.js'

@Injectable()
export class AppConfigService {
  loadEnvironmentFile(): void {
    loadEnvironmentFile({ path: this.optional('ENV_FILE', '.env') })
  }

  required(name: string): string {
    const value = trim(process.env[name])

    if (value.length === 0) {
      throw new Error(`Required configuration is missing key=${name}`)
    }

    return value
  }

  optional(name: string, fallback: string): string {
    const value = trim(process.env[name])
    return value.length === 0 ? fallback : value
  }

  integer(
    name: string,
    fallback: number,
    minimum: number,
    maximum: number,
  ): number {
    const rawValue = this.optional(name, String(fallback))
    const value = toNumber(rawValue)

    if (!isFinite(value) || !Number.isInteger(value)) {
      throw new Error(`Configuration must be an integer key=${name}`)
    }

    if (value < minimum || value > maximum) {
      throw new Error(
        `Configuration is outside its allowed range key=${name} minimum=${minimum} maximum=${maximum}`,
      )
    }

    return value
  }

  boolean(name: string, fallback: boolean): boolean {
    const value = this.optional(name, String(fallback))

    if (value === 'true') {
      return true
    }

    if (value === 'false') {
      return false
    }

    throw new Error(`Configuration must be true or false key=${name}`)
  }

  list(name: string): readonly string[] {
    const values = map(split(this.required(name), ','), (value) => trim(value))
    const cleanedValues = uniq(compact(values))

    if (cleanedValues.length === 0) {
      throw new Error(`Configuration list must not be empty key=${name}`)
    }

    return cleanedValues
  }

  get isProduction(): boolean {
    return this.optional('NODE_ENV', 'development') === 'production'
  }

  get serviceName(): string {
    return this.required('SERVICE_NAME')
  }

  get accessTokenSecret(): string {
    return this.secret('JWT_ACCESS_SECRET')
  }

  get refreshTokenSecret(): string {
    return this.secret('JWT_REFRESH_SECRET')
  }

  get jwtIssuer(): string {
    return this.required('JWT_ISSUER')
  }

  get jwtAudience(): string {
    return this.required('JWT_AUDIENCE')
  }

  get accessTokenTtlSeconds(): number {
    return this.integer('JWT_ACCESS_TTL_SECONDS', 900, 60, 3600)
  }

  get refreshTokenTtlSeconds(): number {
    return this.integer('JWT_REFRESH_TTL_SECONDS', 2_592_000, 3600, 31_536_000)
  }

  get accessCookieName(): string {
    return this.optional('ACCESS_COOKIE_NAME', 'access_token')
  }

  get refreshCookieName(): string {
    return this.optional('REFRESH_COOKIE_NAME', 'refresh_token')
  }

  get cookieDomain(): string | undefined {
    const value = trim(process.env.COOKIE_DOMAIN)
    return value.length === 0 ? undefined : value
  }

  get corsOrigins(): readonly string[] {
    return this.list('CORS_ORIGINS')
  }

  get rabbitmqUrl(): string {
    return this.required('RABBITMQ_URL')
  }

  get databaseHost(): string {
    return this.required('DATABASE_HOST')
  }

  get databasePort(): number {
    return this.integer('DATABASE_PORT', 5432, 1, 65_535)
  }

  get databaseUser(): string {
    return this.required('DATABASE_USER')
  }

  get databasePassword(): string {
    return this.required('DATABASE_PASSWORD')
  }

  get databaseName(): string {
    return this.required('DATABASE_NAME')
  }

  validateDatabase(): void {
    void this.databaseHost
    void this.databasePort
    void this.databaseUser
    void this.databasePassword
    void this.databaseName
  }

  validateHttp(servicePortName: string): void {
    this.integer(servicePortName, 3000, 1, 65_535)
    void this.accessTokenSecret
    void this.jwtIssuer
    void this.jwtAudience
    void this.corsOrigins
    void this.rabbitmqUrl
    this.validateDatabase()
  }

  validateUserService(): void {
    this.validateHttp('USER_SERVICE_PORT')
    void this.refreshTokenSecret
    void this.refreshTokenTtlSeconds
  }

  private secret(name: string): string {
    const value = this.required(name)

    if (value.length < 32) {
      throw new Error(`Secret configuration is too short key=${name}`)
    }

    return value
  }
}
