import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common'
import {
  ApiCookieAuth,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger'
import { AccessAuthGuard, Roles, RolesGuard } from 'auth'
import { PaginationResponse } from 'common'
import { UserRole } from 'contracts'
import { AssignTaskDto } from './dto/assign-task.dto.js'
import { CreateTaskDto } from './dto/create-task.dto.js'
import { TaskQueryDto } from './dto/task-query.dto.js'
import { TaskResponseDto } from './dto/task-response.dto.js'
import { UpdateTaskStatusDto } from './dto/update-task-status.dto.js'
import { TasksService } from './tasks.service.js'

@Controller('tasks')
@ApiTags('tasks')
@ApiCookieAuth('access_token')
@UseGuards(AccessAuthGuard)
export class TasksController {
  constructor(private readonly tasks: TasksService) {}

  @Post()
  create(@Body() input: CreateTaskDto): Promise<TaskResponseDto> {
    return this.tasks.create(input)
  }

  @Get()
  list(
    @Query() query: TaskQueryDto,
  ): Promise<PaginationResponse<TaskResponseDto>> {
    return this.tasks.list(query)
  }

  @Get(':id')
  @ApiOkResponse({ type: TaskResponseDto })
  getById(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<TaskResponseDto> {
    return this.tasks.getById(id)
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() input: UpdateTaskStatusDto,
  ): Promise<TaskResponseDto> {
    return this.tasks.updateStatus(id, input.status)
  }

  @Patch(':id/assign')
  @Roles([UserRole.ADMIN])
  @UseGuards(RolesGuard)
  assign(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() input: AssignTaskDto,
  ): Promise<TaskResponseDto> {
    return this.tasks.assign(id, input)
  }

  @Delete(':id')
  @Roles([UserRole.ADMIN])
  @UseGuards(RolesGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  delete(@Param('id', new ParseUUIDPipe()) id: string): Promise<void> {
    return this.tasks.delete(id)
  }
}
