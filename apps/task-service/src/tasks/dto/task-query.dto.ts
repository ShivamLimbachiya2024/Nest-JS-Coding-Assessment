import { ApiPropertyOptional } from '@nestjs/swagger'
import { PaginationQueryDto } from 'common'
import { TaskStatus } from 'contracts'
import { IsEnum, IsOptional, IsUUID } from 'class-validator'

export class TaskQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: TaskStatus, enumName: 'TaskStatus' })
  @IsOptional()
  @IsEnum(TaskStatus)
  declare readonly status?: TaskStatus

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  declare readonly assignedUserId?: string
}
