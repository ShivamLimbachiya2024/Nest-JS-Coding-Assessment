import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsOptional, IsString, IsUUID, Length } from 'class-validator'

export class CreateTaskDto {
  @ApiProperty({ minLength: 2, maxLength: 150 })
  @IsString()
  @Length(2, 150)
  declare readonly title: string

  @ApiPropertyOptional({ maxLength: 1000 })
  @IsOptional()
  @IsString()
  @Length(0, 1000)
  declare readonly description?: string

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  declare readonly assignedUserId: string
}
