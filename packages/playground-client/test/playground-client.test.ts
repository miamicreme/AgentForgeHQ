import { describe, expect, it, vi } from 'vitest'
import { PlaygroundClient } from '../src/index.js'

const execution = { id:'11111111-1111-4111-8111-111111111111', state:'queued', agentVersionId:'22222222-2222-4222-8222-222222222222', workspaceId:'33333333-3333-4333-8333-333333333333', createdAt:'2026-07-17T00:00:00Z' }

describe('PlaygroundClient', () => {
  it('starts and cancels executions through typed boundaries', async () => {
    const transport = { request: vi.fn().mockResolvedValue(execution) }
    const client = new PlaygroundClient(transport)
    await expect(client.start({workspaceId:execution.workspaceId,agentVersionId:execution.agentVersionId,input:{task:'inspect'}})).resolves.toEqual(execution)
    await expect(client.cancel(execution.id,'user requested')).resolves.toEqual(execution)
  })

  it('rejects cross-execution or non-contiguous events', async () => {
    const transport = { request: vi.fn().mockResolvedValue([{sequence:2,executionId:execution.id,type:'state_changed',at:'2026-07-17T00:00:00Z',data:{}}]) }
    await expect(new PlaygroundClient(transport).events(execution.id)).rejects.toThrow(/sequence/)
  })
})
