import { Injectable } from '@nestjs/common'
import { plainToInstance } from 'class-transformer'
import { validateSync } from 'class-validator'
import isEmpty from 'lodash/isEmpty.js'
import { randomUUID } from 'node:crypto'
import { MessageEnvelope } from './message-envelope.js'
import { MessageType } from './message-type.enum.js'
import { TaskCompleted } from './task-completed.js'
import {
  UserExistenceRequest,
  UserExistenceResponse,
} from './user-existence.js'

@Injectable()
export class ContractsService {
  createEnvelope<TPayload>(
    messageType: MessageType,
    producer: string,
    correlationId: string,
    payload: TPayload,
    messageId = randomUUID(),
  ): MessageEnvelope<TPayload> {
    const envelope = new MessageEnvelope<TPayload>()
    envelope.messageId = messageId
    envelope.correlationId = correlationId
    envelope.messageType = messageType
    envelope.producer = producer
    envelope.occurredAt = new Date().toISOString()
    envelope.payload = payload
    return envelope
  }

  parseEnvelope(value: unknown): MessageEnvelope {
    return this.parse(MessageEnvelope, value)
  }

  parseUserExistenceRequest(value: unknown): UserExistenceRequest {
    return this.parse(UserExistenceRequest, value)
  }

  parseUserExistenceResponse(value: unknown): UserExistenceResponse {
    return this.parse(UserExistenceResponse, value)
  }

  parseTaskCompleted(value: unknown): TaskCompleted {
    return this.parse(TaskCompleted, value)
  }

  private parse<T extends object>(
    contract: new () => T,
    value: unknown,
  ): T {
    const parsed = plainToInstance(contract, value, {
      excludeExtraneousValues: true,
    })

    if (!isEmpty(validateSync(parsed, { whitelist: true, forbidNonWhitelisted: true }))) {
      throw new Error('Message contract validation failed')
    }

    return parsed
  }
}
