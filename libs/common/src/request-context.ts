import { Injectable } from '@nestjs/common'
import { AsyncLocalStorage } from 'node:async_hooks'

interface CorrelationStore {
  readonly correlationId: string
}

@Injectable()
export class RequestContext {
  private readonly storage = new AsyncLocalStorage<CorrelationStore>()

  run(correlationId: string, callback: () => void): void {
    this.storage.run({ correlationId }, callback)
  }

  get correlationId(): string {
    return this.storage.getStore()?.correlationId ?? 'correlation-unavailable'
  }
}
