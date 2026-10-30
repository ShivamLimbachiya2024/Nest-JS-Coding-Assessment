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
  ApiCreatedResponse,
  ApiExtraModels,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiTags,
  getSchemaPath,
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
@ApiExtraModels(TaskResponseDto)
@UseGuards(AccessAuthGuard)
export class TasksController {
  constructor(private readonly tasks: TasksService) {}

  @Post()
  @ApiCreatedResponse({ type: TaskResponseDto })
  create(@Body() input: CreateTaskDto): Promise<TaskResponseDto> {
    return this.tasks.create(input)
  }

  @Get()
  @ApiOkResponse({
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: { $ref: getSchemaPath(TaskResponseDto) },
        },
        meta: {
          type: 'object',
          properties: {
            page: { type: 'integer', example: 1 },
            pageSize: { type: 'integer', example: 20 },
            total: { type: 'integer', example: 42 },
            totalPages: { type: 'integer', example: 3 },
          },
          required: ['page', 'pageSize', 'total', 'totalPages'],
        },
      },
      required: ['data', 'meta'],
    },
  })
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
  @ApiOkResponse({ type: TaskResponseDto })
  updateStatus(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() input: UpdateTaskStatusDto,
  ): Promise<TaskResponseDto> {
    return this.tasks.updateStatus(id, input.status)
  }

  @Patch(':id/assign')
  @ApiOkResponse({ type: TaskResponseDto })
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
