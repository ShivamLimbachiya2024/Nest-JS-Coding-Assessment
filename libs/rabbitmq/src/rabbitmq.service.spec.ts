import { WorkerQueue } from 'contracts'
import {
  ExchangeName,
  QueueRouteKind,
  RoutingKey,
  resolveQueueRoute,
} from './topology.js'
import { WorkerSelection } from './worker-selection.js'

describe('WorkerSelection', () => {
  const ownedQueues = [WorkerQueue.USER_VERIFICATION]

  it('selects one owned queue', () => {
    expect(
      WorkerSelection.select(WorkerQueue.USER_VERIFICATION, ownedQueues),
    ).toBe(WorkerQueue.USER_VERIFICATION)
  })

  it('rejects a missing queue', () => {
    expect(() => WorkerSelection.select(undefined, ownedQueues)).toThrow(
      'WORKER_QUEUE is required',
    )
  })

  it('rejects multiple queues', () => {
    expect(() =>
      WorkerSelection.select(
        `${WorkerQueue.USER_VERIFICATION},${WorkerQueue.NOTIFICATION_TASK_COMPLETED}`,
        ownedQueues,
      ),
    ).toThrow('WORKER_QUEUE must select exactly one queue')
  })

  it('rejects a queue owned by another service', () => {
    expect(() =>
      WorkerSelection.select(
        WorkerQueue.NOTIFICATION_TASK_COMPLETED,
        ownedQueues,
      ),
    ).toThrow('WORKER_QUEUE is not owned by this service')
  })
})

describe('resolveQueueRoute', () => {
  it('routes user verification through the RPC exchange', () => {
    expect(resolveQueueRoute(WorkerQueue.USER_VERIFICATION)).toEqual({
      kind: QueueRouteKind.EXCHANGE,
      exchange: ExchangeName.RPC,
      routingKey: RoutingKey.USERS_EXISTS_REQUEST,
    })
  })

  it('routes completion events through the events exchange', () => {
    expect(resolveQueueRoute(WorkerQueue.NOTIFICATION_TASK_COMPLETED)).toEqual({
      kind: QueueRouteKind.EXCHANGE,
      exchange: ExchangeName.EVENTS,
      routingKey: RoutingKey.TASK_COMPLETED,
    })
  })

  it('routes RPC replies directly to the broker reply queue', () => {
    expect(resolveQueueRoute(WorkerQueue.RPC_REPLY)).toEqual({
      kind: QueueRouteKind.DIRECT,
      queue: WorkerQueue.RPC_REPLY,
    })
  })

  it('routes retries and terminal failures through their exchanges', () => {
    expect(resolveQueueRoute(WorkerQueue.NOTIFICATION_RETRY_ONE)).toEqual({
      kind: QueueRouteKind.EXCHANGE,
      exchange: ExchangeName.RETRY,
      routingKey: RoutingKey.NOTIFICATION_RETRY_ONE,
    })
    expect(resolveQueueRoute(WorkerQueue.NOTIFICATION_RETRY_TWO)).toEqual({
      kind: QueueRouteKind.EXCHANGE,
      exchange: ExchangeName.RETRY,
      routingKey: RoutingKey.NOTIFICATION_RETRY_TWO,
    })
    expect(resolveQueueRoute(WorkerQueue.NOTIFICATION_RETRY_THREE)).toEqual({
      kind: QueueRouteKind.EXCHANGE,
      exchange: ExchangeName.RETRY,
      routingKey: RoutingKey.NOTIFICATION_RETRY_THREE,
    })
    expect(resolveQueueRoute(WorkerQueue.NOTIFICATION_DEAD)).toEqual({
      kind: QueueRouteKind.EXCHANGE,
      exchange: ExchangeName.DEAD_LETTER,
      routingKey: RoutingKey.NOTIFICATION_DEAD,
    })
  })
})
