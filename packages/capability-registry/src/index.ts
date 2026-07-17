import { z } from 'zod';

export const riskLevelSchema = z.enum(['low', 'medium', 'high', 'critical']);
export type RiskLevel = z.infer<typeof riskLevelSchema>;

export const skillManifestSchema = z.object({
  id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  version: z.string().regex(/^\d+\.\d+\.\d+$/),
  name: z.string().min(2).max(100),
  description: z.string().min(10).max(500),
  dependencies: z.array(z.string()).default([]),
  tools: z.array(z.string()).default([]),
  entrypoint: z.string().min(1),
  provenance: z.object({
    source: z.string().min(1),
    license: z.string().min(1),
  }),
}).strict();

export const toolManifestSchema = z.object({
  id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  version: z.string().regex(/^\d+\.\d+\.\d+$/),
  name: z.string().min(2).max(100),
  description: z.string().min(10).max(500),
  riskLevel: riskLevelSchema,
  timeoutMs: z.number().int().min(100).max(120_000),
  maximumRetries: z.number().int().min(0).max(5),
  requiresApproval: z.boolean(),
  inputSchema: z.record(z.unknown()),
  outputSchema: z.record(z.unknown()),
}).strict();

export type SkillManifest = z.infer<typeof skillManifestSchema>;
export type ToolManifest = z.infer<typeof toolManifestSchema>;

export class CapabilityRegistry {
  private readonly skills = new Map<string, SkillManifest>();
  private readonly tools = new Map<string, ToolManifest>();

  registerSkill(input: unknown): SkillManifest {
    const skill = skillManifestSchema.parse(input);
    this.skills.set(`${skill.id}@${skill.version}`, skill);
    return skill;
  }

  registerTool(input: unknown): ToolManifest {
    const tool = toolManifestSchema.parse(input);
    this.tools.set(`${tool.id}@${tool.version}`, tool);
    return tool;
  }

  resolveSkill(id: string, version: string): SkillManifest {
    const skill = this.skills.get(`${id}@${version}`);
    if (!skill) throw new Error(`Skill not found: ${id}@${version}`);
    for (const dependency of skill.dependencies) {
      if (![...this.skills.keys()].some((key) => key.startsWith(`${dependency}@`))) {
        throw new Error(`Missing skill dependency: ${dependency}`);
      }
    }
    return skill;
  }

  resolveTool(id: string, version: string): ToolManifest {
    const tool = this.tools.get(`${id}@${version}`);
    if (!tool) throw new Error(`Tool not found: ${id}@${version}`);
    return tool;
  }
}

export interface ToolExecutionContext {
  executionId: string;
  workspaceId: string;
  actorId: string;
  allowedToolIds: readonly string[];
  approvedToolCallIds: readonly string[];
  signal?: AbortSignal;
}

export interface ToolCallRequest {
  toolCallId: string;
  toolId: string;
  version: string;
  input: unknown;
}

export interface ToolCallResult {
  toolCallId: string;
  status: 'completed' | 'approval_required' | 'blocked' | 'failed';
  output?: unknown;
  error?: string;
  durationMs: number;
}

export type ToolExecutor = (input: unknown, context: ToolExecutionContext) => Promise<unknown>;

export class ToolGateway {
  private readonly executors = new Map<string, ToolExecutor>();

  constructor(private readonly registry: CapabilityRegistry) {}

  registerExecutor(toolId: string, version: string, executor: ToolExecutor): void {
    this.executors.set(`${toolId}@${version}`, executor);
  }

  async execute(request: ToolCallRequest, context: ToolExecutionContext): Promise<ToolCallResult> {
    const startedAt = Date.now();
    if (!context.allowedToolIds.includes(request.toolId)) {
      return { toolCallId: request.toolCallId, status: 'blocked', error: 'Tool is not allowed for this agent', durationMs: Date.now() - startedAt };
    }

    const manifest = this.registry.resolveTool(request.toolId, request.version);
    if (manifest.requiresApproval && !context.approvedToolCallIds.includes(request.toolCallId)) {
      return { toolCallId: request.toolCallId, status: 'approval_required', durationMs: Date.now() - startedAt };
    }

    const executor = this.executors.get(`${request.toolId}@${request.version}`);
    if (!executor) {
      return { toolCallId: request.toolCallId, status: 'failed', error: 'No executor registered', durationMs: Date.now() - startedAt };
    }

    try {
      const output = await Promise.race([
        executor(request.input, context),
        new Promise<never>((_, reject) => {
          const timer = setTimeout(() => reject(new Error(`Tool timed out after ${manifest.timeoutMs}ms`)), manifest.timeoutMs);
          context.signal?.addEventListener('abort', () => {
            clearTimeout(timer);
            reject(new Error('Tool call aborted'));
          }, { once: true });
        }),
      ]);
      return { toolCallId: request.toolCallId, status: 'completed', output, durationMs: Date.now() - startedAt };
    } catch (error) {
      return {
        toolCallId: request.toolCallId,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown tool failure',
        durationMs: Date.now() - startedAt,
      };
    }
  }
}
