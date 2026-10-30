import { ApiProperty } from '@nestjs/swagger'
import { IsString, Length } from 'class-validator'

export class ChangePasswordDto {
  @ApiProperty({ minLength: 12, maxLength: 128, writeOnly: true })
  @IsString()
  @Length(12, 128)
  declare readonly currentPassword: string

  @ApiProperty({ minLength: 12, maxLength: 128, writeOnly: true })
  @IsString()
  @Length(12, 128)
  declare readonly newPassword: string
}
