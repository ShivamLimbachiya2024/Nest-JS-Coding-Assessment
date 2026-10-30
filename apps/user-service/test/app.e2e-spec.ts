import { Test, TestingModule } from '@nestjs/testing'
import { INestApplication, ValidationPipe } from '@nestjs/common'
import cookieParser from 'cookie-parser'
import { ApplicationExceptionFilter } from 'common'
import { AppConfigService } from 'config'
import { DataSource } from 'typeorm'
import { RabbitmqService } from 'rabbitmq'
import { jest } from '@jest/globals'
import request from 'supertest'
import { App } from 'supertest/types'
import find from 'lodash/find.js'
import join from 'lodash/join.js'
import map from 'lodash/map.js'
import split from 'lodash/split.js'
import startsWith from 'lodash/startsWith.js'
import { randomUUID } from 'node:crypto'
import { AppModule } from './../src/app.module.js'

describe('AppController (e2e)', () => {
  let app: INestApplication<App>
  const email = `change-password-${randomUUID()}@example.test`

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    app = moduleFixture.createNestApplication()
    app.use(cookieParser())
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    )
    app.useGlobalFilters(app.get(ApplicationExceptionFilter))
    await app.init()
  })

  it('/health/live (GET)', () => {
    return request(app.getHttpServer())
      .get('/health/live')
      .expect(200)
      .expect({ status: 'live' })
  })

  it('/health/ready (GET)', () => {
    return request(app.getHttpServer())
      .get('/health/ready')
      .expect(200)
      .expect({ status: 'ready' })
  })

  it('/health/ready (GET) returns unavailable when RabbitMQ is disconnected', () => {
    jest
      .spyOn(app.get(RabbitmqService), 'isReady', 'get')
      .mockReturnValue(false)

    return request(app.getHttpServer()).get('/health/ready').expect(503)
  })

  it('/health/ready (GET) returns unavailable when PostgreSQL query fails', () => {
    jest
      .spyOn(app.get(DataSource), 'query')
      .mockRejectedValue(new Error('Database unavailable'))

    return request(app.getHttpServer()).get('/health/ready').expect(503)
  })

  it('changes the authenticated user password and revokes refresh sessions', async () => {
    const origin = 'http://localhost:3000'
    const oldPassword = 'Current-Password-123!'
    const newPassword = 'Replacement-Password-456!'
    const config = app.get(AppConfigService)

    await request(app.getHttpServer())
      .patch('/users/password')
      .set('Origin', origin)
      .send({ currentPassword: oldPassword, newPassword })
      .expect(401)

    await request(app.getHttpServer())
      .post('/users/register')
      .set('Origin', origin)
      .send({
        name: 'Password Change User',
        email,
        password: oldPassword,
        role: 'MEMBER',
      })
      .expect(201)

    const login = await request(app.getHttpServer())
      .post('/users/login')
      .set('Origin', origin)
      .send({ email, password: oldPassword })
      .expect(200)
    const cookiePairs = map(
      login.headers['set-cookie'] ?? [],
      (cookie) => split(cookie, ';')[0] ?? '',
    )
    const accessCookie = find(cookiePairs, (cookie) =>
      startsWith(cookie, `${config.accessCookieName}=`),
    )
    const refreshCookie = find(cookiePairs, (cookie) =>
      startsWith(cookie, `${config.refreshCookieName}=`),
    )

    if (accessCookie === undefined || refreshCookie === undefined) {
      throw new Error('Login cookies were not issued')
    }

    await request(app.getHttpServer())
      .patch('/users/password')
      .set('Origin', origin)
      .set('Cookie', join(cookiePairs, '; '))
      .send({ currentPassword: 'Wrong-Password-123!', newPassword })
      .expect(401)

    await request(app.getHttpServer())
      .patch('/users/password')
      .set('Origin', origin)
      .set('Cookie', join(cookiePairs, '; '))
      .send({ currentPassword: oldPassword, newPassword: oldPassword })
      .expect(400)

    const passwordChange = await request(app.getHttpServer())
      .patch('/users/password')
      .set('Origin', origin)
      .set('Cookie', join(cookiePairs, '; '))
      .send({ currentPassword: oldPassword, newPassword })
      .expect(204)

    expect(passwordChange.headers['set-cookie']).toHaveLength(2)

    await request(app.getHttpServer())
      .post('/users/refresh')
      .set('Origin', origin)
      .set('Cookie', refreshCookie)
      .expect(401)

    await request(app.getHttpServer())
      .post('/users/login')
      .set('Origin', origin)
      .send({ email, password: oldPassword })
      .expect(401)

    await request(app.getHttpServer())
      .post('/users/login')
      .set('Origin', origin)
      .send({ email, password: newPassword })
      .expect(200)
  })

  afterEach(async () => {
    if (app === undefined) {
      return
    }

    jest.restoreAllMocks()
    const dataSource = app.get(DataSource)
    await dataSource.query(
      'DELETE FROM users.refresh_sessions WHERE user_id IN (SELECT id FROM users.users WHERE email = $1)',
      [email],
    )
    await dataSource.query('DELETE FROM users.users WHERE email = $1', [email])
    await app.close()
  })
})
