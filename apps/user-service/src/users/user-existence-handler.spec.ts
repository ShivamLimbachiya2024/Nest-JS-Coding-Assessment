import { Test, TestingModule } from '@nestjs/testing'
import { UserExistenceHandler } from './user-existence-handler.js'

describe('UserExistenceHandler', () => {
  let provider: UserExistenceHandler

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UserExistenceHandler],
    })
      .useMocker(() => ({}))
      .compile()

    provider = module.get<UserExistenceHandler>(UserExistenceHandler)
  })

  it('should be defined', () => {
    expect(provider).toBeDefined()
  })
})
