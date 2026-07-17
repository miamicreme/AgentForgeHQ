import { createHash, randomUUID } from 'node:crypto'
import { z } from 'zod'

const executionCreateSchema = z.object({
  workspaceId: z.string().uuid(),
  agentVersionId: z.string().uuid(),
  input: z.record(z.string(), z.unknown()),
  idempotencyKey: z.string().trim().min(8).max(200).optional(),
}).strict()

export type ExecutionCreateInput = z.infer<typeof executionCreateSchema>
export type ExecutionRecord = Readonly<{
  id: string
  workspaceId: string
  agentVersionId: string
  input: Readonly<Record<string, unknown>>
  idempotencyKey: string
  status: 'queued'
  createdBy: string
  createdAt: string
}>

export interface ExecutionRepository {
  findByIdempotency(workspaceId: string, key: string): Promise<ExecutionRecord | null>
  insert(record: ExecutionRecord): Promise<void>
}

export interface ExecutionQueue { enqueue(executionId: string): Promise<void> }
export interface AgentVersionReader {
  assertRunnable(workspaceId: string, agentVersionId: string): Promise<void>
}

function deterministicKey(input: ExecutionCreateInput, userId: string): string {
  return createHash('sha256').update(JSON.stringify({ ...input, idempotencyKey: undefined, userId })).digest('hex')
}

export class ExecutionCommandService {
  constructor(
    private readonly repository: ExecutionRepository,
    private readonly queue: ExecutionQueue,
    private readonly versions: AgentVersionReader,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async create(raw: unknown, userId: string): Promise<Readonly<{ record: ExecutionRecord; duplicate: boolean }>> {
    if (!userId.trim()) throw new Error('Authenticated user is required')
    const input = executionCreateSchema.parse(raw)
    await this.versions.assertRunnable(input.workspaceId, input.agentVersionId)
    const idempotencyKey = input.idempotencyKey ?? deterministicKey(input, userId)
    const existing = await this.repository.findByIdempotency(input.workspaceId, idempotencyKey)
    if (existing) return Object.freeze({ record: existing, duplicate: true })

    const record: ExecutionRecord = Object.freeze({
      id: randomUUID(),
      workspaceId: input.workspaceId,
      agentVersionId: input.agentVersionId,
      input: Object.freeze({ ...input.input }),
      idempotencyKey,
      status: 'queued',
      createdBy: userId,
      createdAt: this.now().toISOString(),
    })
    await this.repository.insert(record)
    await this.queue.enqueue(record.id)
    return Object.freeze({ record, duplicate: false })
  }
}

export { executionCreateSchema }
