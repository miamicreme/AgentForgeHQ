import { z } from 'zod'

const executionStateSchema = z.enum([
  'queued','validating','compiling','running','waiting_for_approval','evaluating',
  'completed','validation_failed','execution_failed','approval_denied','limit_exceeded',
  'timed_out','evaluation_failed','cancelled',
])

const executionSchema = z.object({
  id: z.string().uuid(),
  state: executionStateSchema,
  agentVersionId: z.string().uuid(),
  workspaceId: z.string().uuid(),
  createdAt: z.string().datetime(),
}).strict()

const eventSchema = z.object({
  sequence: z.number().int().positive(),
  executionId: z.string().uuid(),
  type: z.string().min(1),
  at: z.string().datetime(),
  data: z.record(z.string(), z.unknown()),
}).strict()

export type PlaygroundExecution = z.infer<typeof executionSchema>
export type PlaygroundEvent = z.infer<typeof eventSchema>
export interface PlaygroundTransport {
  request(method: 'GET'|'POST', path: string, body?: unknown): Promise<unknown>
}

export class PlaygroundClient {
  constructor(private readonly transport: PlaygroundTransport) {}

  async start(input: Readonly<{workspaceId:string;agentVersionId:string;input:Readonly<Record<string,unknown>>;idempotencyKey?:string}>): Promise<PlaygroundExecution> {
    return executionSchema.parse(await this.transport.request('POST','/api/executions',input))
  }

  async read(executionId: string): Promise<PlaygroundExecution> {
    if (!executionId.trim()) throw new Error('Execution id is required')
    return executionSchema.parse(await this.transport.request('GET',`/api/executions/${encodeURIComponent(executionId)}`))
  }

  async events(executionId: string): Promise<readonly PlaygroundEvent[]> {
    if (!executionId.trim()) throw new Error('Execution id is required')
    const response = z.array(eventSchema).parse(await this.transport.request('GET',`/api/executions/${encodeURIComponent(executionId)}/events`))
    for (let i = 0; i < response.length; i += 1) {
      if (response[i].executionId !== executionId) throw new Error('Cross-execution event detected')
      if (response[i].sequence !== i + 1) throw new Error('Execution timeline sequence is not contiguous')
    }
    return Object.freeze(response.map(Object.freeze))
  }

  async cancel(executionId: string, reason: string): Promise<PlaygroundExecution> {
    if (reason.trim().length < 3) throw new Error('Cancellation reason must be at least 3 characters')
    return executionSchema.parse(await this.transport.request('POST',`/api/executions/${encodeURIComponent(executionId)}/cancel`,{reason}))
  }
}

export { executionSchema, eventSchema }
