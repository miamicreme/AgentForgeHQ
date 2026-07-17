import { createHash } from 'node:crypto'
import { z } from 'zod'

export type JobStatus = 'queued' | 'leased' | 'completed' | 'failed' | 'dead_letter'
export type DurableJob = Readonly<{
  executionId: string
  attempt: number
  status: JobStatus
  leaseOwner?: string
  leaseExpiresAt?: string
  lastError?: string
}>

export function leaseJob(job: DurableJob, workerId: string, now: Date, leaseMs = 30_000): DurableJob {
  if (!workerId.trim()) throw new Error('Worker id is required')
  if (!Number.isInteger(leaseMs) || leaseMs <= 0) throw new Error('Lease duration must be positive')
  if (!['queued', 'leased'].includes(job.status)) throw new Error(`Job cannot be leased from ${job.status}`)
  if (job.status === 'leased' && job.leaseExpiresAt && new Date(job.leaseExpiresAt).getTime() > now.getTime()) {
    throw new Error('Job already has an active lease')
  }
  return Object.freeze({ ...job, status: 'leased', leaseOwner: workerId, leaseExpiresAt: new Date(now.getTime() + leaseMs).toISOString() })
}

export function failJob(job: DurableJob, error: unknown, maximumAttempts = 3): DurableJob {
  if (job.status !== 'leased') throw new Error('Only leased jobs may fail')
  const attempt = job.attempt + 1
  const lastError = error instanceof Error ? error.message : String(error)
  return Object.freeze({
    executionId: job.executionId,
    attempt,
    status: attempt >= maximumAttempts ? 'dead_letter' : 'queued',
    lastError: lastError.slice(0, 1000),
  })
}

export type JsonSchema = Readonly<{
  type: 'object'
  required?: readonly string[]
  properties: Readonly<Record<string, Readonly<{ type: 'string' | 'number' | 'integer' | 'boolean' }>>>
  additionalProperties?: boolean
}>

export function validateToolPayload(schema: JsonSchema, payload: unknown): Readonly<Record<string, unknown>> {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) throw new Error('Tool payload must be an object')
  const record = payload as Record<string, unknown>
  const allowed = new Set(Object.keys(schema.properties))
  if (schema.additionalProperties === false) {
    for (const key of Object.keys(record)) if (!allowed.has(key)) throw new Error(`Unexpected tool property: ${key}`)
  }
  for (const key of schema.required ?? []) if (!(key in record)) throw new Error(`Missing required tool property: ${key}`)
  for (const [key, rule] of Object.entries(schema.properties)) {
    if (!(key in record)) continue
    const value = record[key]
    if (rule.type === 'integer' && !Number.isInteger(value)) throw new Error(`Tool property ${key} must be integer`)
    if (rule.type !== 'integer' && typeof value !== rule.type) throw new Error(`Tool property ${key} must be ${rule.type}`)
  }
  return Object.freeze({ ...record })
}

export type ApprovalEnvelope = Readonly<{
  executionId: string
  toolCallId: string
  action: string
  requestHash: string
  expiresAt: string
}>

export function bindApproval(input: Omit<ApprovalEnvelope, 'requestHash'>, payload: unknown): ApprovalEnvelope {
  for (const value of [input.executionId, input.toolCallId, input.action]) if (!value.trim()) throw new Error('Approval identity fields are required')
  const requestHash = createHash('sha256').update(JSON.stringify({ ...input, payload })).digest('hex')
  return Object.freeze({ ...input, requestHash })
}

export function assertApprovalMatches(expected: ApprovalEnvelope, actual: ApprovalEnvelope, now: Date): void {
  if (new Date(expected.expiresAt).getTime() <= now.getTime()) throw new Error('Approval expired')
  for (const key of ['executionId', 'toolCallId', 'action', 'requestHash'] as const) {
    if (expected[key] !== actual[key]) throw new Error(`Approval mismatch: ${key}`)
  }
}

const providerResponseSchema = z.object({
  id: z.string().min(1),
  output_text: z.string(),
  usage: z.object({ input_tokens: z.number().int().nonnegative(), output_tokens: z.number().int().nonnegative() }).strict(),
}).strict()

export interface ProviderTransport {
  post(path: string, body: unknown, signal: AbortSignal): Promise<unknown>
}

export class OpenAIResponsesAdapter {
  readonly provider = 'openai'
  constructor(private readonly transport: ProviderTransport, private readonly timeoutMs = 60_000) {
    if (!Number.isInteger(timeoutMs) || timeoutMs <= 0) throw new Error('Provider timeout must be positive')
  }

  async complete(input: Readonly<{ model: string; messages: readonly Readonly<{ role: string; content: string }>[] }>): Promise<Readonly<{ text: string; promptTokens: number; completionTokens: number; providerRequestId: string }>> {
    if (!input.model.trim() || input.messages.length === 0) throw new Error('Model and messages are required')
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), this.timeoutMs)
    try {
      const response = providerResponseSchema.parse(await this.transport.post('/v1/responses', input, controller.signal))
      return Object.freeze({ text: response.output_text, promptTokens: response.usage.input_tokens, completionTokens: response.usage.output_tokens, providerRequestId: response.id })
    } finally {
      clearTimeout(timer)
    }
  }
}

export type TimelineReference = Readonly<{
  executionId: string
  stepId?: string
  toolCallId?: string
  approvalId?: string
  evaluationResultId?: string
  releaseId?: string
  deploymentId?: string
}>

export function assertTimelineReference(reference: TimelineReference): TimelineReference {
  if (!reference.executionId.trim()) throw new Error('Timeline execution id is required')
  const childIds = Object.entries(reference).filter(([key, value]) => key !== 'executionId' && value !== undefined)
  for (const [key, value] of childIds) if (typeof value !== 'string' || !value.trim()) throw new Error(`Invalid timeline reference: ${key}`)
  return Object.freeze({ ...reference })
}

export interface GitHubReadTransport { get(path: string, signal?: AbortSignal): Promise<unknown> }
export class GitHubReadConnector {
  constructor(private readonly transport: GitHubReadTransport) {}
  async repository(owner: string, repo: string): Promise<unknown> {
    const segment = /^[A-Za-z0-9_.-]+$/
    if (!segment.test(owner) || !segment.test(repo)) throw new Error('Invalid repository coordinates')
    return this.transport.get(`/repos/${owner}/${repo}`)
  }
  async tree(owner: string, repo: string, ref: string): Promise<unknown> {
    if (!ref.trim() || ref.includes('..')) throw new Error('Invalid repository ref')
    await this.repository(owner, repo)
    return this.transport.get(`/repos/${owner}/${repo}/git/trees/${encodeURIComponent(ref)}?recursive=1`)
  }
  async file(owner: string, repo: string, path: string, ref: string): Promise<unknown> {
    if (!path.trim() || path.startsWith('/') || path.split('/').includes('..')) throw new Error('Unsafe repository path')
    return this.transport.get(`/repos/${owner}/${repo}/contents/${path.split('/').map(encodeURIComponent).join('/')}?ref=${encodeURIComponent(ref)}`)
  }
}
