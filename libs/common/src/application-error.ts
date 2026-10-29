import { ErrorCode } from './error-code.enum.js'

export class ApplicationError extends Error {
  constructor(
    readonly code: ErrorCode,
    readonly status: number,
    message: string,
    readonly details?: Readonly<Record<string, readonly string[]>>,
  ) {
    super(message)
    this.name = ApplicationError.name
  }
}
