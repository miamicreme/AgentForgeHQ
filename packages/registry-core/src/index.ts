import { z } from 'zod';

export const agentStatusSchema = z.enum(['draft', 'testing', 'approved', 'published', 'retired']);
export type AgentStatus = z.infer<typeof agentStatusSchema>;

export const agentRecordSchema = z.object({
  id: z.string().uuid(),
  workspaceId: z.string().uuid(),
  name: z.string().min(2).max(100),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  description: z.string().max(500).default(''),
  status: agentStatusSchema,
  currentVersionId: z.string().uuid().nullable(),
  createdBy: z.string().uuid(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
}).strict();

export const createAgentInputSchema = agentRecordSchema.pick({
  workspaceId: true,
  name: true,
  slug: true,
  description: true,
  createdBy: true,
});

export const listAgentsQuerySchema = z.object({
  workspaceId: z.string().uuid(),
  status: agentStatusSchema.optional(),
  search: z.string().max(100).optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(25),
}).strict();

export const agentVersionSchema = z.object({
  id: z.string().uuid(),
  agentId: z.string().uuid(),
  versionNumber: z.number().int().positive(),
  specification: z.record(z.unknown()),
  compiledInstructions: z.record(z.unknown()),
  status: agentStatusSchema,
  releaseNotes: z.string().max(2000).default(''),
  createdBy: z.string().uuid(),
  createdAt: z.string().datetime(),
}).strict();

const transitions: Record<AgentStatus, readonly AgentStatus[]> = {
  draft: ['testing', 'retired'],
  testing: ['draft', 'approved', 'retired'],
  approved: ['testing', 'published', 'retired'],
  published: ['retired'],
  retired: [],
};

export function canTransition(from: AgentStatus, to: AgentStatus): boolean {
  return transitions[from].includes(to);
}

export function assertTransition(from: AgentStatus, to: AgentStatus): void {
  if (!canTransition(from, to)) {
    throw new Error(`Invalid agent status transition: ${from} -> ${to}`);
  }
}

export interface RegistryRepository {
  createAgent(input: z.infer<typeof createAgentInputSchema>): Promise<z.infer<typeof agentRecordSchema>>;
  listAgents(query: z.infer<typeof listAgentsQuerySchema>): Promise<{
    items: z.infer<typeof agentRecordSchema>[];
    nextCursor: string | null;
  }>;
  getAgent(workspaceId: string, agentId: string): Promise<z.infer<typeof agentRecordSchema> | null>;
  createVersion(input: Omit<z.infer<typeof agentVersionSchema>, 'id' | 'createdAt'>): Promise<z.infer<typeof agentVersionSchema>>;
  listVersions(agentId: string): Promise<z.infer<typeof agentVersionSchema>[]>;
}

export function assertVersionMutable(status: AgentStatus): void {
  if (status === 'published' || status === 'retired') {
    throw new Error(`Agent version in ${status} state is immutable`);
  }
}
