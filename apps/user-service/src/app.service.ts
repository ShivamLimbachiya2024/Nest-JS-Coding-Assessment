import { Injectable, ServiceUnavailableException } from '@nestjs/common'
import { RabbitmqService } from 'rabbitmq'
import { DataSource } from 'typeorm'

@Injectable()
export class AppService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly rabbitmq: RabbitmqService,
  ) {}

  live(): Readonly<Record<string, string>> {
    return { status: 'live' }
  }

  async ready(): Promise<Readonly<Record<string, string>>> {
    if (!this.dataSource.isInitialized || !this.rabbitmq.isReady) {
      throw new ServiceUnavailableException(
        'Service dependencies are unavailable',
      )
    }

    try {
      await this.dataSource.query('SELECT 1')
    } catch {
      throw new ServiceUnavailableException(
        'Service dependencies are unavailable',
      )
    }

    return { status: 'ready' }
  }
}
