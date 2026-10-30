import { Test, TestingModule } from '@nestjs/testing'
import { TaskServiceController } from '../../src/task-service.controller.js'
import { TaskServiceService } from '../../src/task-service.service.js'

describe('TaskServiceController', () => {
  let taskServiceController: TaskServiceController

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [TaskServiceController],
      providers: [TaskServiceService],
    })
      .useMocker(() => ({}))
      .compile()

    taskServiceController = app.get<TaskServiceController>(
      TaskServiceController,
    )
  })

  it('returns the liveness state', () => {
    expect(taskServiceController.live()).toEqual({ status: 'live' })
  })
})
