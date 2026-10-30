import { ApiProperty } from '@nestjs/swagger'
import { UserRole } from 'contracts'

export class UserResponseDto {
  @ApiProperty({ format: 'uuid' })
  declare readonly id: string

  @ApiProperty()
  declare readonly name: string

  @ApiProperty({ format: 'email' })
  declare readonly email: string

  @ApiProperty({ enum: UserRole, enumName: 'UserRole' })
  declare readonly role: UserRole

  @ApiProperty({ format: 'date-time' })
  declare readonly createdAt: string

  constructor(input: {
    readonly id: string
    readonly name: string
    readonly email: string
    readonly role: UserRole
    readonly createdAt: Date
  }) {
    this.id = input.id
    this.name = input.name
    this.email = input.email
    this.role = input.role
    this.createdAt = input.createdAt.toISOString()
  }
}
