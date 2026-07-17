import { describe, expect, it } from 'vitest'
import { summarizeExecutions } from '../src/index.js'

describe('observability summaries', () => {
  it('calculates outcome, cost, and latency metrics', () => {
    const result = summarizeExecutions([
      {executionId:'1',agentVersionId:'v1',status:'completed',durationMs:100,costUsd:0.1,promptTokens:1,completionTokens:1,occurredAt:'2026-07-17T00:00:00Z'},
      {executionId:'2',agentVersionId:'v1',status:'failed',durationMs:300,costUsd:0.2,promptTokens:2,completionTokens:1,occurredAt:'2026-07-17T00:01:00Z'},
    ])
    expect(result.successRate).toBe(0.5)
    expect(result.totalCostUsd).toBe(0.3)
    expect(result.p95DurationMs).toBe(300)
  })
  it('rejects invalid metrics', () => {
    expect(() => summarizeExecutions([{executionId:'1',agentVersionId:'v1',status:'completed',durationMs:-1,costUsd:0,promptTokens:0,completionTokens:0,occurredAt:''}])).toThrow(/Invalid duration/)
  })
})
