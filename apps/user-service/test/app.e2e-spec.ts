import { Test, TestingModule } from '@nestjs/testing'
import { INestApplication } from '@nestjs/common'
import { DataSource } from 'typeorm'
import { RabbitmqService } from 'rabbitmq'
import { jest } from '@jest/globals'
import request from 'supertest'
import { App } from 'supertest/types'
import { AppModule } from './../src/app.module.js'

describe('AppController (e2e)', () => {
  let app: INestApplication<App>

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    app = moduleFixture.createNestApplication()
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

  afterEach(async () => {
    await app.close()
  })
})
