export type ExecutionMetric = Readonly<{
  executionId:string
  agentVersionId:string
  status:'completed'|'failed'|'cancelled'
  durationMs:number
  costUsd:number
  promptTokens:number
  completionTokens:number
  occurredAt:string
}>

export type ObserveSummary = Readonly<{
  total:number
  completed:number
  failed:number
  cancelled:number
  successRate:number
  totalCostUsd:number
  averageCostUsd:number
  p50DurationMs:number
  p95DurationMs:number
}>

function percentile(values: readonly number[], ratio:number):number {
  if (values.length === 0) return 0
  const ordered = [...values].sort((a,b) => a-b)
  return ordered[Math.min(ordered.length - 1, Math.ceil(ordered.length * ratio) - 1)]
}

export function summarizeExecutions(metrics: readonly ExecutionMetric[]): ObserveSummary {
  for (const metric of metrics) {
    if (!Number.isFinite(metric.durationMs) || metric.durationMs < 0) throw new Error('Invalid duration')
    if (!Number.isFinite(metric.costUsd) || metric.costUsd < 0) throw new Error('Invalid cost')
  }
  const completed = metrics.filter((metric) => metric.status === 'completed').length
  const failed = metrics.filter((metric) => metric.status === 'failed').length
  const cancelled = metrics.filter((metric) => metric.status === 'cancelled').length
  const totalCostUsd = Number(metrics.reduce((sum, metric) => sum + metric.costUsd, 0).toFixed(6))
  return Object.freeze({
    total: metrics.length,
    completed,
    failed,
    cancelled,
    successRate: metrics.length ? Number((completed / metrics.length).toFixed(4)) : 0,
    totalCostUsd,
    averageCostUsd: metrics.length ? Number((totalCostUsd / metrics.length).toFixed(6)) : 0,
    p50DurationMs: percentile(metrics.map((metric) => metric.durationMs), 0.5),
    p95DurationMs: percentile(metrics.map((metric) => metric.durationMs), 0.95),
  })
}
