import { describe, expect, it } from 'vitest'
import { summarizeExecutions } from '../src/index.js'

const metric = {executionId:'1',agentVersionId:'v1',status:'completed' as const,durationMs:100,costUsd:0.1,promptTokens:1,completionTokens:1,occurredAt:'2026-07-17T00:00:00Z'}

describe('observability summaries', () => {
  it('calculates outcome, cost, and latency metrics', () => {
    const result = summarizeExecutions([
      metric,
      {...metric,executionId:'2',status:'failed',durationMs:300,costUsd:0.2,promptTokens:2,occurredAt:'2026-07-17T00:01:00Z'},
    ])
    expect(result.successRate).toBe(0.5)
    expect(result.totalCostUsd).toBe(0.3)
    expect(result.p95DurationMs).toBe(300)
  })
  it('returns stable zero values for an empty window', () => {
    expect(summarizeExecutions([])).toEqual({total:0,completed:0,failed:0,cancelled:0,successRate:0,totalCostUsd:0,averageCostUsd:0,p50DurationMs:0,p95DurationMs:0})
  })
  it('rejects invalid metrics', () => {
    expect(() => summarizeExecutions([{...metric,durationMs:-1}])).toThrow(/Invalid duration/)
    expect(() => summarizeExecutions([{...metric,promptTokens:1.5}])).toThrow(/Invalid prompt tokens/)
    expect(() => summarizeExecutions([{...metric,occurredAt:'not-a-date'}])).toThrow(/Invalid occurrence timestamp/)
  })
  it('rejects duplicate execution metrics', () => {
    expect(() => summarizeExecutions([metric, metric])).toThrow(/Duplicate execution metric/)
  })
})
