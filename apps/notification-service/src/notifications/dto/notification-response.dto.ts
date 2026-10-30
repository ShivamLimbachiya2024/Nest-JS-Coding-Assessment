import { ApiProperty } from '@nestjs/swagger'

export class NotificationResponseDto {
  @ApiProperty({ format: 'uuid' })
  declare readonly id: string

  @ApiProperty()
  declare readonly message: string

  @ApiProperty()
  declare readonly isRead: boolean

  @ApiProperty({ format: 'date-time' })
  declare readonly createdAt: string

  constructor(input: {
    readonly id: string
    readonly message: string
    readonly isRead: boolean
    readonly createdAt: Date
  }) {
    this.id = input.id
    this.message = input.message
    this.isRead = input.isRead
    this.createdAt = input.createdAt.toISOString()
  }
}
