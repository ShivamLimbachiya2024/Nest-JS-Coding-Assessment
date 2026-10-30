import { Test, TestingModule } from '@nestjs/testing'
import { OutboxPublisherService } from './outbox-publisher.service.js'

describe('OutboxPublisherService', () => {
  let service: OutboxPublisherService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OutboxPublisherService],
    })
      .useMocker(() => ({}))
      .compile()

    service = module.get<OutboxPublisherService>(OutboxPublisherService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
