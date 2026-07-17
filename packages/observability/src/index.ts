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
  if (!Number.isFinite(ratio) || ratio <= 0 || ratio > 1) throw new Error('Percentile ratio must be within (0, 1]')
  if (values.length === 0) return 0
  const ordered = [...values].sort((a,b) => a-b)
  return ordered[Math.min(ordered.length - 1, Math.ceil(ordered.length * ratio) - 1)]
}

function assertMetric(metric: ExecutionMetric): void {
  if (!metric.executionId.trim()) throw new Error('Execution id is required')
  if (!metric.agentVersionId.trim()) throw new Error('Agent version id is required')
  if (!Number.isFinite(metric.durationMs) || metric.durationMs < 0) throw new Error('Invalid duration')
  if (!Number.isFinite(metric.costUsd) || metric.costUsd < 0) throw new Error('Invalid cost')
  if (!Number.isInteger(metric.promptTokens) || metric.promptTokens < 0) throw new Error('Invalid prompt tokens')
  if (!Number.isInteger(metric.completionTokens) || metric.completionTokens < 0) throw new Error('Invalid completion tokens')
  if (!Number.isFinite(Date.parse(metric.occurredAt))) throw new Error('Invalid occurrence timestamp')
}

export function summarizeExecutions(metrics: readonly ExecutionMetric[]): ObserveSummary {
  const executionIds = new Set<string>()
  for (const metric of metrics) {
    assertMetric(metric)
    if (executionIds.has(metric.executionId)) throw new Error(`Duplicate execution metric: ${metric.executionId}`)
    executionIds.add(metric.executionId)
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
