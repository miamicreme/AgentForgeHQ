import { describe, expect, it, vi } from 'vitest'
import {
  GitHubReadConnector,
  OpenAIResponsesAdapter,
  assertApprovalMatches,
  assertTimelineReference,
  bindApproval,
  failJob,
  leaseJob,
  validateToolPayload,
} from '../src/index.js'

describe('production runtime integration', () => {
  it('leases expired work and dead-letters bounded retries', () => {
    const leased = leaseJob({ executionId: 'e1', attempt: 2, status: 'queued' }, 'worker-1', new Date('2026-07-17T00:00:00Z'))
    expect(leased.status).toBe('leased')
    expect(failJob(leased, new Error('boom'), 3).status).toBe('dead_letter')
  })

  it('rejects active duplicate leases', () => {
    expect(() => leaseJob({ executionId:'e1', attempt:0, status:'leased', leaseOwner:'w1', leaseExpiresAt:'2026-07-17T00:01:00Z' }, 'w2', new Date('2026-07-17T00:00:00Z'))).toThrow(/active lease/)
  })

  it('validates closed tool payloads', () => {
    const schema = { type:'object', required:['path'], properties:{ path:{type:'string'}, depth:{type:'integer'} }, additionalProperties:false } as const
    expect(validateToolPayload(schema, { path:'src', depth:2 })).toEqual({ path:'src', depth:2 })
    expect(() => validateToolPayload(schema, { path:'src', secret:true })).toThrow(/Unexpected/)
  })

  it('binds approval to request identity and expiry', () => {
    const envelope = bindApproval({ executionId:'e1', toolCallId:'t1', action:'file_write', expiresAt:'2026-07-17T01:00:00Z' }, { path:'a.ts' })
    expect(() => assertApprovalMatches(envelope, { ...envelope, toolCallId:'t2' }, new Date('2026-07-17T00:00:00Z'))).toThrow(/toolCallId/)
    expect(() => assertApprovalMatches(envelope, envelope, new Date('2026-07-17T02:00:00Z'))).toThrow(/expired/)
  })

  it('normalizes provider responses through one transport boundary', async () => {
    const transport = { post: vi.fn().mockResolvedValue({ id:'req-1', output_text:'ok', usage:{ input_tokens:2, output_tokens:1 } }) }
    const adapter = new OpenAIResponsesAdapter(transport)
    await expect(adapter.complete({ model:'gpt-test', messages:[{role:'user',content:'hello'}] })).resolves.toMatchObject({ text:'ok', providerRequestId:'req-1' })
  })

  it('rejects malformed provider usage', async () => {
    const adapter = new OpenAIResponsesAdapter({ post: async () => ({ id:'req-1', output_text:'ok', usage:{ input_tokens:-1, output_tokens:1 } }) })
    await expect(adapter.complete({ model:'gpt-test', messages:[{role:'user',content:'hello'}] })).rejects.toThrow()
  })

  it('protects GitHub paths and remains read-only', async () => {
    const transport = { get: vi.fn().mockResolvedValue({ ok:true }) }
    const connector = new GitHubReadConnector(transport)
    await connector.file('owner','repo','src/index.ts','main')
    expect(transport.get).toHaveBeenCalledWith('/repos/owner/repo/contents/src/index.ts?ref=main')
    await expect(connector.file('owner','repo','../secret','main')).rejects.toThrow(/Unsafe/)
  })

  it('requires correlated timeline execution identity', () => {
    expect(assertTimelineReference({ executionId:'e1', approvalId:'a1' })).toEqual({ executionId:'e1', approvalId:'a1' })
    expect(() => assertTimelineReference({ executionId:'' })).toThrow(/execution id/)
  })
})
