import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Query,
  UseGuards,
} from '@nestjs/common'
import {
  ApiCookieAuth,
  ApiExtraModels,
  ApiOkResponse,
  ApiTags,
  getSchemaPath,
} from '@nestjs/swagger'
import { AccessAuthGuard } from 'auth'
import { PaginationResponse } from 'common'
import { UserQueryDto } from './dto/user-query.dto.js'
import { UserResponseDto } from './dto/user-response.dto.js'
import { UsersService } from './users.service.js'

@Controller('users')
@ApiTags('users')
@ApiCookieAuth('access_token')
@ApiExtraModels(UserResponseDto)
@UseGuards(AccessAuthGuard)
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get(':id')
  @ApiOkResponse({ type: UserResponseDto })
  getById(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<UserResponseDto> {
    return this.users.getById(id)
  }

  @Get()
  @ApiOkResponse({
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: { $ref: getSchemaPath(UserResponseDto) },
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
    @Query() query: UserQueryDto,
  ): Promise<PaginationResponse<UserResponseDto>> {
    return this.users.list(query)
  }
}
