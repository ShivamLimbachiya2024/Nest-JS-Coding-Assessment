import { ApiProperty } from '@nestjs/swagger'
import { IsUUID } from 'class-validator'

export class AssignTaskDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  declare readonly assignedUserId: string
}
