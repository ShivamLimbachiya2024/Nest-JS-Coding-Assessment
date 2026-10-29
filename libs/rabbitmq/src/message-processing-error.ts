import { RabbitErrorCode } from './topology.js'

export class MessageProcessingError extends Error {
  constructor(
    message: string,
    readonly retryable: boolean,
    readonly code: RabbitErrorCode,
  ) {
    super(message)
    this.name = MessageProcessingError.name
  }
}
