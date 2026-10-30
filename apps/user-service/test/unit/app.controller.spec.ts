import { Test, TestingModule } from '@nestjs/testing'
import { AppController } from '../../src/app.controller.js'
import { AppService } from '../../src/app.service.js'

describe('AppController', () => {
  let appController: AppController

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    })
      .useMocker(() => ({}))
      .compile()

    appController = app.get<AppController>(AppController)
  })

  it('returns the liveness state', () => {
    expect(appController.live()).toEqual({ status: 'live' })
  })
})
