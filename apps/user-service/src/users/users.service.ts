import { HttpStatus, Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { ApplicationError, ErrorCode, PaginationResponse } from 'common'
import { UserRole } from 'contracts'
import { UserEntity } from 'database/user-service'
import toLower from 'lodash/toLower.js'
import trim from 'lodash/trim.js'
import map from 'lodash/map.js'
import get from 'lodash/get.js'
import { QueryFailedError, Repository } from 'typeorm'
import { UserQueryDto } from './dto/user-query.dto.js'
import { UserResponseDto } from './dto/user-response.dto.js'

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly users: Repository<UserEntity>,
  ) {}

  normalizeEmail(email: string): string {
    return toLower(trim(email))
  }

  async create(input: {
    readonly name: string
    readonly email: string
    readonly passwordHash: string
    readonly role: UserRole
  }): Promise<UserResponseDto> {
    const user = this.users.create(input)

    try {
      const saved = await this.users.save(user)
      return new UserResponseDto(saved)
    } catch (error: unknown) {
      const driverCode: unknown =
        error instanceof QueryFailedError
          ? get(error.driverError, 'code')
          : undefined

      if (driverCode === '23505') {
        throw new ApplicationError(
          ErrorCode.EMAIL_CONFLICT,
          HttpStatus.CONFLICT,
          'A user with this email already exists',
        )
      }

      throw error
    }
  }

  async findCredentials(email: string): Promise<UserEntity | null> {
    return this.users
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .where('user.email = :email', { email })
      .getOne()
  }

  async findCredentialsById(id: string): Promise<UserEntity | null> {
    return this.users
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .where('user.id = :id', { id })
      .getOne()
  }

  async getById(id: string): Promise<UserResponseDto> {
    const user = await this.users.findOneBy({ id })

    if (user === null) {
      throw new ApplicationError(
        ErrorCode.USER_NOT_FOUND,
        HttpStatus.NOT_FOUND,
        'User was not found',
      )
    }

    return new UserResponseDto(user)
  }

  async list(
    query: UserQueryDto,
  ): Promise<PaginationResponse<UserResponseDto>> {
    const [users, total] = await this.users.findAndCount({
      order: { createdAt: 'DESC', id: 'ASC' },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    })

    return {
      data: map(users, (user) => new UserResponseDto(user)),
      meta: {
        page: query.page,
        pageSize: query.pageSize,
        total,
        totalPages: Math.ceil(total / query.pageSize),
      },
    }
  }

  async exists(id: string): Promise<boolean> {
    return this.users.existsBy({ id })
  }
}
