export type ExecutionState =
  | 'queued' | 'validating' | 'compiling' | 'running' | 'waiting_for_approval' | 'evaluating'
  | 'completed' | 'validation_failed' | 'execution_failed' | 'approval_denied'
  | 'limit_exceeded' | 'timed_out' | 'evaluation_failed' | 'cancelled';

export interface ExecutionLimits {
  maximumSteps: number;
  maximumToolCalls: number;
  maximumCostUsd: number;
  timeoutMs: number;
}

export interface ExecutionEvent {
  sequence: number;
  executionId: string;
  type: 'state_changed' | 'step_started' | 'step_completed' | 'tool_requested' | 'approval_requested' | 'approval_decided' | 'usage_recorded' | 'error';
  at: string;
  data: Readonly<Record<string, unknown>>;
}

export interface ExecutionSnapshot {
  id: string;
  state: ExecutionState;
  stepCount: number;
  toolCallCount: number;
  costUsd: number;
  startedAt: number;
  pendingApprovalToolCallId?: string;
  events: readonly ExecutionEvent[];
}

const terminalStates = new Set<ExecutionState>([
  'completed', 'validation_failed', 'execution_failed', 'approval_denied',
  'limit_exceeded', 'timed_out', 'evaluation_failed', 'cancelled',
]);

const allowedTransitions: Record<ExecutionState, readonly ExecutionState[]> = {
  queued: ['validating', 'timed_out', 'cancelled'],
  validating: ['compiling', 'validation_failed', 'timed_out', 'cancelled'],
  compiling: ['running', 'validation_failed', 'timed_out', 'cancelled'],
  running: ['waiting_for_approval', 'evaluating', 'execution_failed', 'limit_exceeded', 'timed_out', 'cancelled'],
  waiting_for_approval: ['running', 'approval_denied', 'timed_out', 'cancelled'],
  evaluating: ['completed', 'evaluation_failed', 'timed_out', 'cancelled'],
  completed: [], validation_failed: [], execution_failed: [], approval_denied: [],
  limit_exceeded: [], timed_out: [], evaluation_failed: [], cancelled: [],
};

function validateLimits(limits: ExecutionLimits): void {
  const integerFields: Array<keyof Pick<ExecutionLimits, 'maximumSteps' | 'maximumToolCalls' | 'timeoutMs'>> = ['maximumSteps', 'maximumToolCalls', 'timeoutMs'];
  for (const field of integerFields) {
    if (!Number.isInteger(limits[field]) || limits[field] <= 0) throw new Error(`${field} must be a positive integer`);
  }
  if (!Number.isFinite(limits.maximumCostUsd) || limits.maximumCostUsd < 0) throw new Error('maximumCostUsd must be a non-negative finite number');
}

export class ExecutionRuntime {
  private snapshot: ExecutionSnapshot;

  constructor(id: string, private readonly limits: ExecutionLimits, now = Date.now()) {
    if (!id.trim()) throw new Error('Execution id is required');
    if (!Number.isFinite(now)) throw new Error('Execution start time must be finite');
    validateLimits(limits);
    this.snapshot = { id, state: 'queued', stepCount: 0, toolCallCount: 0, costUsd: 0, startedAt: now, events: [] };
  }

  get current(): ExecutionSnapshot { return structuredClone(this.snapshot); }

  transition(next: ExecutionState, data: Record<string, unknown> = {}): ExecutionSnapshot {
    const previous = this.snapshot.state;
    if (terminalStates.has(previous)) throw new Error(`Execution is terminal: ${previous}`);
    if (!allowedTransitions[previous].includes(next)) throw new Error(`Invalid execution transition: ${previous} -> ${next}`);
    this.snapshot = {
      ...this.snapshot,
      state: next,
      pendingApprovalToolCallId: next === 'waiting_for_approval' ? this.snapshot.pendingApprovalToolCallId : undefined,
    };
    this.append('state_changed', { from: previous, to: next, ...data });
    return this.current;
  }

  recordStep(kind: string): void {
    this.assertRunning();
    if (!kind.trim()) throw new Error('Step kind is required');
    const next = this.snapshot.stepCount + 1;
    if (next > this.limits.maximumSteps) return void this.transition('limit_exceeded', { limit: 'maximumSteps' });
    this.snapshot = { ...this.snapshot, stepCount: next };
    this.append('step_started', { kind, step: next });
  }

  recordToolCall(toolId: string): void {
    this.assertRunning();
    if (!toolId.trim()) throw new Error('Tool id is required');
    const next = this.snapshot.toolCallCount + 1;
    if (next > this.limits.maximumToolCalls) return void this.transition('limit_exceeded', { limit: 'maximumToolCalls' });
    this.snapshot = { ...this.snapshot, toolCallCount: next };
    this.append('tool_requested', { toolId, toolCall: next });
  }

  recordUsage(costUsd: number): void {
    this.assertActive();
    if (!Number.isFinite(costUsd) || costUsd < 0) throw new Error('Cost must be a non-negative finite number');
    const next = Number((this.snapshot.costUsd + costUsd).toFixed(6));
    if (next > this.limits.maximumCostUsd) return void this.transition('limit_exceeded', { limit: 'maximumCostUsd', costUsd: next });
    this.snapshot = { ...this.snapshot, costUsd: next };
    this.append('usage_recorded', { costUsd, totalCostUsd: next });
  }

  enforceTimeout(now = Date.now()): void {
    if (!Number.isFinite(now)) throw new Error('Timeout check time must be finite');
    if (!terminalStates.has(this.snapshot.state) && now - this.snapshot.startedAt >= this.limits.timeoutMs) {
      this.transition('timed_out', { elapsedMs: now - this.snapshot.startedAt });
    }
  }

  requestApproval(toolCallId: string, reason: string): void {
    this.assertRunning();
    if (!toolCallId.trim()) throw new Error('Tool call id is required');
    if (reason.trim().length < 3) throw new Error('Approval reason must be at least 3 characters');
    this.snapshot = { ...this.snapshot, pendingApprovalToolCallId: toolCallId };
    this.transition('waiting_for_approval', { toolCallId, reason });
    this.append('approval_requested', { toolCallId, reason });
  }

  decideApproval(toolCallId: string, decision: 'approved' | 'denied', reviewerId: string, reason: string): void {
    if (this.snapshot.state !== 'waiting_for_approval') throw new Error('Execution is not awaiting approval');
    if (toolCallId !== this.snapshot.pendingApprovalToolCallId) throw new Error('Approval tool call does not match pending request');
    if (!reviewerId.trim()) throw new Error('Reviewer id is required');
    if (reason.trim().length < 3) throw new Error('Decision reason must be at least 3 characters');
    this.append('approval_decided', { toolCallId, decision, reviewerId, reason });
    this.transition(decision === 'approved' ? 'running' : 'approval_denied', { toolCallId, reviewerId, reason });
  }

  private assertActive(): void {
    if (terminalStates.has(this.snapshot.state)) throw new Error(`Execution is terminal: ${this.snapshot.state}`);
  }

  private assertRunning(): void {
    this.assertActive();
    if (this.snapshot.state !== 'running') throw new Error(`Execution is not running: ${this.snapshot.state}`);
  }

  private append(type: ExecutionEvent['type'], data: Record<string, unknown>): void {
    const event: ExecutionEvent = Object.freeze({
      sequence: this.snapshot.events.length + 1,
      executionId: this.snapshot.id,
      type,
      at: new Date().toISOString(),
      data: Object.freeze({ ...data }),
    });
    this.snapshot = { ...this.snapshot, events: [...this.snapshot.events, event] };
  }
}
