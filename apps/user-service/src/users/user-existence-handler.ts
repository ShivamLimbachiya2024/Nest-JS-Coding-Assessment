import { Injectable } from '@nestjs/common'
import { ContractsService, MessageType, UserExistenceResponse } from 'contracts'
import { StoryLogger } from 'logger'
import { RabbitmqService } from 'rabbitmq'
import { ConsumeMessage } from 'amqplib'
import { UsersService } from './users.service.js'

@Injectable()
export class UserExistenceHandler {
  constructor(
    private readonly contracts: ContractsService,
    private readonly rabbitmq: RabbitmqService,
    private readonly users: UsersService,
    private readonly logger: StoryLogger,
  ) {}

  async handle(value: unknown, delivery: ConsumeMessage): Promise<void> {
    const envelope = this.contracts.parseEnvelope(value)

    if (envelope.messageType !== MessageType.USERS_EXISTS_REQUEST) {
      throw new Error('Unexpected user verification message type')
    }

    const request = this.contracts.parseUserExistenceRequest(envelope.payload)
    const exists = await this.users.exists(request.userId)
    const response = new UserExistenceResponse()
    response.userId = request.userId
    response.exists = exists
    const replyEnvelope = this.contracts.createEnvelope(
      MessageType.USERS_EXISTS_RESPONSE,
      'user-service',
      envelope.correlationId,
      response,
    )
    const replyTo = delivery.properties.replyTo
    const correlationId = delivery.properties.correlationId

    if (replyTo === undefined || correlationId === undefined) {
      throw new Error('User verification reply metadata is missing')
    }

    await this.rabbitmq.reply(correlationId, replyTo, replyEnvelope)
    this.logger.info(
      `User verification reply confirmed correlationId=${envelope.correlationId} operation=verify-user outcome=completed messageId=${envelope.messageId} userId=${request.userId} exists=${exists}`,
    )
  }
}
