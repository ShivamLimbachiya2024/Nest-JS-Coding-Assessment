import { Test, TestingModule } from '@nestjs/testing'
import { TaskflowConfigService } from './config.service.js'

describe('TaskflowConfigService', () => {
  let service: TaskflowConfigService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TaskflowConfigService],
    }).compile()

    service = module.get<TaskflowConfigService>(TaskflowConfigService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
