import { Test, TestingModule } from '@nestjs/testing'
import { TaskCompletedHandler } from './task-completed-handler.js'

describe('TaskCompletedHandler', () => {
  let provider: TaskCompletedHandler

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TaskCompletedHandler],
    })
      .useMocker(() => ({}))
      .compile()

    provider = module.get<TaskCompletedHandler>(TaskCompletedHandler)
  })

  it('should be defined', () => {
    expect(provider).toBeDefined()
  })
})
