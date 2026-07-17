import { describe, expect, it } from 'vitest';
import { CapabilityRegistry, ToolGateway } from '../src/index';

const tool = {
  id: 'repository-files',
  version: '1.0.0',
  name: 'Repository Files',
  description: 'Reads repository files through a bounded adapter.',
  riskLevel: 'medium' as const,
  timeoutMs: 1000,
  maximumRetries: 1,
  requiresApproval: true,
  inputSchema: { type: 'object' },
  outputSchema: { type: 'object' },
};

describe('capability registry and gateway', () => {
  it('blocks tools not granted to an agent', async () => {
    const registry = new CapabilityRegistry();
    registry.registerTool(tool);
    const gateway = new ToolGateway(registry);
    const result = await gateway.execute(
      { toolCallId: 'call-1', toolId: tool.id, version: tool.version, input: {} },
      { executionId: 'e1', workspaceId: 'w1', actorId: 'u1', allowedToolIds: [], approvedToolCallIds: [] },
    );
    expect(result.status).toBe('blocked');
  });

  it('pauses approval-required tools before execution', async () => {
    const registry = new CapabilityRegistry();
    registry.registerTool(tool);
    const gateway = new ToolGateway(registry);
    gateway.registerExecutor(tool.id, tool.version, async () => ({ ok: true }));
    const result = await gateway.execute(
      { toolCallId: 'call-2', toolId: tool.id, version: tool.version, input: {} },
      { executionId: 'e1', workspaceId: 'w1', actorId: 'u1', allowedToolIds: [tool.id], approvedToolCallIds: [] },
    );
    expect(result.status).toBe('approval_required');
  });

  it('executes approved tools', async () => {
    const registry = new CapabilityRegistry();
    registry.registerTool(tool);
    const gateway = new ToolGateway(registry);
    gateway.registerExecutor(tool.id, tool.version, async () => ({ ok: true }));
    const result = await gateway.execute(
      { toolCallId: 'call-3', toolId: tool.id, version: tool.version, input: {} },
      { executionId: 'e1', workspaceId: 'w1', actorId: 'u1', allowedToolIds: [tool.id], approvedToolCallIds: ['call-3'] },
    );
    expect(result.status).toBe('completed');
    expect(result.output).toEqual({ ok: true });
  });
});
