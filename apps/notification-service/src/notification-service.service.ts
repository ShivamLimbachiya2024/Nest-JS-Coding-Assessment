import { Injectable } from '@nestjs/common'
import { RabbitmqService } from 'rabbitmq'
import { DataSource } from 'typeorm'

@Injectable()
export class NotificationServiceService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly rabbitmq: RabbitmqService,
  ) {}

  live(): Readonly<Record<string, string>> {
    return { status: 'live' }
  }

  ready(): Readonly<Record<string, string>> {
    return {
      status:
        this.dataSource.isInitialized && this.rabbitmq.isReady
          ? 'ready'
          : 'not-ready',
    }
  }
}
