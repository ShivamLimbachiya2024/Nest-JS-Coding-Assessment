import { Test, TestingModule } from '@nestjs/testing'
import { NotificationServiceController } from './notification-service.controller.js'
import { NotificationServiceService } from './notification-service.service.js'

describe('NotificationServiceController', () => {
  let notificationServiceController: NotificationServiceController

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [NotificationServiceController],
      providers: [NotificationServiceService],
    })
      .useMocker(() => ({}))
      .compile()

    notificationServiceController = app.get<NotificationServiceController>(
      NotificationServiceController,
    )
  })

  it('returns the liveness state', () => {
    expect(notificationServiceController.live()).toEqual({ status: 'live' })
  })
})
