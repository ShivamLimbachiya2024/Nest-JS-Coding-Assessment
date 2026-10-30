import { Test, TestingModule } from '@nestjs/testing'
import { MessageType } from '../../src/message-type.enum.js'
import { UserExistenceRequest } from '../../src/user-existence.js'
import { ContractsService } from '../../src/contracts.service.js'

describe('ContractsService', () => {
  let service: ContractsService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ContractsService],
    }).compile()

    service = module.get<ContractsService>(ContractsService)
  })

  it('preserves and validates the versioned request payload', () => {
    const request = new UserExistenceRequest()
    request.userId = 'b4d2b07e-f02c-428c-8da3-14d0ceac3893'
    const envelope = service.createEnvelope(
      MessageType.USERS_EXISTS_REQUEST,
      'task-service',
      'a648f943-1da8-4090-9c81-8036b7c726c8',
      request,
      '239ea5b1-5ca7-4ab4-ab68-2e1a6e428c9c',
      '2026-10-30T00:00:00.000Z',
    )

    const parsed = service.parseEnvelope(envelope)
    const payload = service.parseUserExistenceRequest(parsed.payload)

    expect(parsed.version).toBe(1)
    expect(payload.userId).toBe(request.userId)
  })

  it('uses the assessment task completion event name', () => {
    expect(MessageType.TASK_COMPLETED).toBe('task.completed')
  })

  it('rejects unsupported message versions', () => {
    expect(() =>
      service.parseEnvelope({
        version: 2,
        messageId: '239ea5b1-5ca7-4ab4-ab68-2e1a6e428c9c',
        correlationId: 'a648f943-1da8-4090-9c81-8036b7c726c8',
        messageType: MessageType.USERS_EXISTS_REQUEST,
        producer: 'task-service',
        occurredAt: '2026-10-30T00:00:00.000Z',
        payload: { userId: 'b4d2b07e-f02c-428c-8da3-14d0ceac3893' },
      }),
    ).toThrow('Message contract validation failed')
  })
})
