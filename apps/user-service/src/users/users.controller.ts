import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Query,
  UseGuards,
} from '@nestjs/common'
import { ApiCookieAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger'
import { AccessAuthGuard } from '@taskflow/auth'
import { PaginationResponse } from '@taskflow/common'
import { UserQueryDto } from './dto/user-query.dto.js'
import { UserResponseDto } from './dto/user-response.dto.js'
import { UsersService } from './users.service.js'

@Controller('users')
@ApiTags('users')
@ApiCookieAuth('taskflow_access_token')
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
  list(
    @Query() query: UserQueryDto,
  ): Promise<PaginationResponse<UserResponseDto>> {
    return this.users.list(query)
  }
}
