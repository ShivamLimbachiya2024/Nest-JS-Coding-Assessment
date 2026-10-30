import { ApiProperty } from '@nestjs/swagger'
import { TaskStatus } from 'contracts'
import { IsEnum } from 'class-validator'

export class UpdateTaskStatusDto {
  @ApiProperty({ enum: TaskStatus, enumName: 'TaskStatus' })
  @IsEnum(TaskStatus)
  declare readonly status: TaskStatus
}
