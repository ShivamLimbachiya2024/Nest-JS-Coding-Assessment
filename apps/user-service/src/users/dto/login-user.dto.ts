import { ApiProperty } from '@nestjs/swagger'
import { IsEmail, IsString, Length } from 'class-validator'

export class LoginUserDto {
  @ApiProperty({ example: 'ada@example.com' })
  @IsEmail()
  declare readonly email: string

  @ApiProperty({ minLength: 12, maxLength: 128, writeOnly: true })
  @IsString()
  @Length(12, 128)
  declare readonly password: string
}
