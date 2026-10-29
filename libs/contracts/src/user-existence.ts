import { Expose } from 'class-transformer'
import { IsBoolean, IsUUID } from 'class-validator'

export class UserExistenceRequest {
  @Expose()
  @IsUUID()
  declare userId: string
}

export class UserExistenceResponse {
  @Expose()
  @IsUUID()
  declare userId: string

  @Expose()
  @IsBoolean()
  declare exists: boolean
}
