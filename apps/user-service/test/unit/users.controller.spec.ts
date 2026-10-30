import { Test, TestingModule } from '@nestjs/testing'
import { UsersController } from '../../src/users/users.controller.js'

describe('UsersController', () => {
  let controller: UsersController

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
    })
      .useMocker(() => ({}))
      .compile()

    controller = module.get<UsersController>(UsersController)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })
})
