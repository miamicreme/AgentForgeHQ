import { describe, expect, it } from 'vitest'
import { ExecutionCommandService, type ExecutionRecord } from '../src/index.js'

const workspaceId = '11111111-1111-4111-8111-111111111111'
const agentVersionId = '22222222-2222-4222-8222-222222222222'

function harness() {
  const records: ExecutionRecord[] = []
  const queued: string[] = []
  const repository = {
    findByIdempotency: async (workspace: string, key: string) => records.find((r) => r.workspaceId === workspace && r.idempotencyKey === key) ?? null,
    insert: async (record: ExecutionRecord) => { records.push(record) },
  }
  const queue = { enqueue: async (id: string) => { queued.push(id) } }
  const versions = { assertRunnable: async (workspace: string, version: string) => {
    if (workspace !== workspaceId || version !== agentVersionId) throw new Error('Version is outside workspace')
  } }
  return { service: new ExecutionCommandService(repository, queue, versions, () => new Date('2026-07-17T00:00:00Z')), records, queued }
}

describe('ExecutionCommandService', () => {
  it('creates and queues one immutable execution', async () => {
    const { service, records, queued } = harness()
    const result = await service.create({ workspaceId, agentVersionId, input: { task: 'inspect' }, idempotencyKey: 'request-0001' }, 'user-1')
    expect(result.duplicate).toBe(false)
    expect(records).toHaveLength(1)
    expect(queued).toEqual([result.record.id])
  })

  it('deduplicates repeated requests', async () => {
    const { service, queued } = harness()
    const request = { workspaceId, agentVersionId, input: { task: 'inspect' }, idempotencyKey: 'request-0001' }
    const first = await service.create(request, 'user-1')
    const second = await service.create(request, 'user-1')
    expect(second.record.id).toBe(first.record.id)
    expect(second.duplicate).toBe(true)
    expect(queued).toHaveLength(1)
  })

  it('rejects unauthenticated and unknown fields', async () => {
    const { service } = harness()
    await expect(service.create({ workspaceId, agentVersionId, input: {} }, '')).rejects.toThrow(/Authenticated/)
    await expect(service.create({ workspaceId, agentVersionId, input: {}, secret: true }, 'user-1')).rejects.toThrow()
  })
})
