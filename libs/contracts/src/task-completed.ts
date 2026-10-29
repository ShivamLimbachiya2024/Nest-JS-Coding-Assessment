import { Expose } from 'class-transformer'
import { IsDateString, IsString, IsUUID, MaxLength } from 'class-validator'

export class TaskCompleted {
  @Expose()
  @IsUUID()
  declare taskId: string

  @Expose()
  @IsUUID()
  declare assignedUserId: string

  @Expose()
  @IsString()
  @MaxLength(150)
  declare taskTitle: string

  @Expose()
  @IsDateString()
  declare completedAt: string
}
