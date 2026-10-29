import { TokenType } from '@taskflow/contracts'
import { Expose } from 'class-transformer'
import { IsEnum, IsUUID } from 'class-validator'

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
}
