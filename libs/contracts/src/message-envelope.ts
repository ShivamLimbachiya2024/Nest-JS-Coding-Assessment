import { MessageType } from './message-type.enum.js'
import { Expose } from 'class-transformer'
import { IsDateString, IsEnum, IsString, IsUUID, MaxLength } from 'class-validator'

export class MessageEnvelope<TPayload = unknown> {
  @Expose()
  @IsUUID()
  declare messageId: string

  @Expose()
  @IsUUID()
  declare correlationId: string

  @Expose()
  @IsEnum(MessageType)
  declare messageType: MessageType

  @Expose()
  @IsString()
  @MaxLength(100)
  declare producer: string

  @Expose()
  @IsDateString()
  declare occurredAt: string

  @Expose()
  declare payload: TPayload
}
