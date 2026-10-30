import { Test, TestingModule } from '@nestjs/testing'
import { StoryLogger } from '../../src/logger.service.js'

describe('StoryLogger', () => {
  let service: StoryLogger

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [StoryLogger],
    })
      .useMocker(() => ({}))
      .compile()

    service = module.get<StoryLogger>(StoryLogger)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
