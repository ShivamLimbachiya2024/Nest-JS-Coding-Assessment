import { ApiProperty } from '@nestjs/swagger'
import { UserRole } from 'contracts'
import { IsEmail, IsEnum, IsString, Length } from 'class-validator'

export class RegisterUserDto {
  @ApiProperty({ example: 'Ada Lovelace', maxLength: 100 })
  @IsString()
  @Length(2, 100)
  declare readonly name: string

  @ApiProperty({ example: 'ada@example.com', maxLength: 320 })
  @IsEmail()
  @Length(3, 320)
  declare readonly email: string

  @ApiProperty({ minLength: 12, maxLength: 128, writeOnly: true })
  @IsString()
  @Length(12, 128)
  declare readonly password: string

  @ApiProperty({ enum: UserRole, enumName: 'UserRole' })
  @IsEnum(UserRole)
  declare readonly role: UserRole
}
