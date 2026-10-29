import { ApiProperty } from '@nestjs/swagger'
import { UserResponseDto } from './user-response.dto.js'

export class RefreshResponseDto {
  @ApiProperty({ type: UserResponseDto })
  declare readonly user: UserResponseDto

  constructor(user: UserResponseDto) {
    this.user = user
  }
}
