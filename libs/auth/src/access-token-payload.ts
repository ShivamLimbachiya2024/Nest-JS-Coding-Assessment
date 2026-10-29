import { TokenType, UserRole } from '@taskflow/contracts'
import { Expose } from 'class-transformer'
import { IsEmail, IsEnum, IsUUID } from 'class-validator'

export class AccessTokenPayload {
  @Expose()
  @IsUUID()
  declare sub: string

  @Expose()
  @IsUUID()
  declare userId: string

  @Expose()
  @IsEmail()
  declare email: string

  @Expose()
  @IsEnum(UserRole)
  declare role: UserRole

  @Expose()
  @IsUUID()
  declare jti: string

  @Expose()
  @IsEnum(TokenType)
  declare type: TokenType.ACCESS
}
