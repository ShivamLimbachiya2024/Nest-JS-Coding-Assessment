import { MessageType } from './message-type.enum.js'
import { Expose } from 'class-transformer'
import {
  Equals,
  Allow,
  IsDateString,
  IsEnum,
  IsInt,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator'

export class MessageEnvelope<
  TPayload = unknown,
  TMessageType extends MessageType = MessageType,
> {
  @Expose()
  @IsInt()
  @Equals(1)
  declare version: 1

  @Expose()
  @IsUUID()
  declare messageId: string

  @Expose()
  @IsUUID()
  declare correlationId: string

  @Expose()
  @IsEnum(MessageType)
  declare messageType: TMessageType

  @Expose()
  @IsString()
  @MaxLength(100)
  declare producer: string

  @Expose()
  @IsDateString()
  declare occurredAt: string

  @Expose()
  @Allow()
  declare payload: TPayload
}
