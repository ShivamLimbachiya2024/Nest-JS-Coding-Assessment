import { Test, TestingModule } from '@nestjs/testing';
import { TaskServiceController } from './task-service.controller.js';
import { TaskServiceService } from './task-service.service.js';

describe('TaskServiceController', () => {
  let taskServiceController: TaskServiceController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [TaskServiceController],
      providers: [TaskServiceService],
    }).compile();

    taskServiceController = app.get<TaskServiceController>(TaskServiceController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(taskServiceController.getHello()).toBe('Hello World!');
    });
  });
});
