import { Controller, Get } from '@nestjs/common';
import { TaskServiceService } from './task-service.service.js';

@Controller()
export class TaskServiceController {
  constructor(private readonly taskServiceService: TaskServiceService) {}

  @Get()
  getHello(): string {
    return this.taskServiceService.getHello();
  }
}
