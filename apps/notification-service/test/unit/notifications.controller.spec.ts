import { Test, TestingModule } from '@nestjs/testing'
import { NotificationsController } from '../../src/notifications/notifications.controller.js'

describe('NotificationsController', () => {
  let controller: NotificationsController

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationsController],
    })
      .useMocker(() => ({}))
      .compile()

    controller = module.get<NotificationsController>(NotificationsController)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })
})
