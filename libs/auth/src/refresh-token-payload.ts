import { TokenType } from 'contracts'
import { Expose } from 'class-transformer'
import { IsEnum, IsInt, IsUUID } from 'class-validator'

export class RefreshTokenPayload {
  @Expose()
  @IsUUID()
  declare sub: string

  @Expose()
  @IsUUID()
  declare sessionId: string

  @Expose()
  @IsUUID()
  declare familyId: string

  @Expose()
  @IsUUID()
  declare jti: string

  @Expose()
  @IsEnum(TokenType)
  declare type: TokenType.REFRESH

  @Expose()
  @IsInt()
  declare iat: number

  @Expose()
  @IsInt()
  declare exp: number
}
