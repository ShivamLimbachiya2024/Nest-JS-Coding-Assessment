import type { ConsumerQueue } from 'contracts'
import find from 'lodash/find.js'
import includes from 'lodash/includes.js'
import trim from 'lodash/trim.js'

export class WorkerSelection {
  static select(
    rawQueue: string | undefined,
    ownedQueues: readonly ConsumerQueue[],
  ): ConsumerQueue {
    const queue = trim(rawQueue)

    if (queue.length === 0) {
      throw new Error('WORKER_QUEUE is required')
    }

    if (includes(queue, ',')) {
      throw new Error('WORKER_QUEUE must select exactly one queue')
    }

    const selectedQueue = find(
      ownedQueues,
      (ownedQueue) => ownedQueue === queue,
    )

    if (selectedQueue === undefined) {
      throw new Error(
        `WORKER_QUEUE is not owned by this service queue=${queue}`,
      )
    }

    return selectedQueue
  }
}
