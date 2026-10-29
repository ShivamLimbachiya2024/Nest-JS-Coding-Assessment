import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { TaskStatus } from '@taskflow/contracts'

export class TaskResponseDto {
  @ApiProperty({ format: 'uuid' })
  declare readonly id: string

  @ApiProperty()
  declare readonly title: string

  @ApiPropertyOptional({ nullable: true })
  declare readonly description: string | null

  @ApiProperty({ enum: TaskStatus, enumName: 'TaskStatus' })
  declare readonly status: TaskStatus

  @ApiProperty({ format: 'uuid' })
  declare readonly assignedUserId: string

  @ApiProperty({ format: 'date-time' })
  declare readonly createdAt: string

  @ApiProperty({ format: 'date-time' })
  declare readonly updatedAt: string

  constructor(input: {
    readonly id: string
    readonly title: string
    readonly description: string | null
    readonly status: TaskStatus
    readonly assignedUserId: string
    readonly createdAt: Date
    readonly updatedAt: Date
  }) {
    this.id = input.id
    this.title = input.title
    this.description = input.description
    this.status = input.status
    this.assignedUserId = input.assignedUserId
    this.createdAt = input.createdAt.toISOString()
    this.updatedAt = input.updatedAt.toISOString()
  }
}
