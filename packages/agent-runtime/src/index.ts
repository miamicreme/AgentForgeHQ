export type ExecutionState =
  | 'queued'
  | 'validating'
  | 'compiling'
  | 'running'
  | 'waiting_for_approval'
  | 'evaluating'
  | 'completed'
  | 'validation_failed'
  | 'execution_failed'
  | 'approval_denied'
  | 'limit_exceeded'
  | 'timed_out'
  | 'evaluation_failed'
  | 'cancelled';

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
  events: readonly ExecutionEvent[];
}

const terminalStates = new Set<ExecutionState>([
  'completed', 'validation_failed', 'execution_failed', 'approval_denied',
  'limit_exceeded', 'timed_out', 'evaluation_failed', 'cancelled',
]);

const allowedTransitions: Record<ExecutionState, readonly ExecutionState[]> = {
  queued: ['validating', 'cancelled'],
  validating: ['compiling', 'validation_failed', 'cancelled'],
  compiling: ['running', 'validation_failed', 'cancelled'],
  running: ['waiting_for_approval', 'evaluating', 'execution_failed', 'limit_exceeded', 'timed_out', 'cancelled'],
  waiting_for_approval: ['running', 'approval_denied', 'timed_out', 'cancelled'],
  evaluating: ['completed', 'evaluation_failed', 'timed_out', 'cancelled'],
  completed: [], validation_failed: [], execution_failed: [], approval_denied: [],
  limit_exceeded: [], timed_out: [], evaluation_failed: [], cancelled: [],
};

export class ExecutionRuntime {
  private snapshot: ExecutionSnapshot;

  constructor(id: string, private readonly limits: ExecutionLimits, now = Date.now()) {
    this.snapshot = { id, state: 'queued', stepCount: 0, toolCallCount: 0, costUsd: 0, startedAt: now, events: [] };
  }

  get current(): ExecutionSnapshot { return structuredClone(this.snapshot); }

  transition(next: ExecutionState, data: Record<string, unknown> = {}): ExecutionSnapshot {
    if (terminalStates.has(this.snapshot.state)) throw new Error(`Execution is terminal: ${this.snapshot.state}`);
    if (!allowedTransitions[this.snapshot.state].includes(next)) {
      throw new Error(`Invalid execution transition: ${this.snapshot.state} -> ${next}`);
    }
    this.snapshot = { ...this.snapshot, state: next };
    this.append('state_changed', { from: this.snapshot.events.at(-1)?.data.to ?? 'none', to: next, ...data });
    return this.current;
  }

  recordStep(kind: string): void {
    this.assertActive();
    const next = this.snapshot.stepCount + 1;
    if (next > this.limits.maximumSteps) return void this.transition('limit_exceeded', { limit: 'maximumSteps' });
    this.snapshot = { ...this.snapshot, stepCount: next };
    this.append('step_started', { kind, step: next });
  }

  recordToolCall(toolId: string): void {
    this.assertActive();
    const next = this.snapshot.toolCallCount + 1;
    if (next > this.limits.maximumToolCalls) return void this.transition('limit_exceeded', { limit: 'maximumToolCalls' });
    this.snapshot = { ...this.snapshot, toolCallCount: next };
    this.append('tool_requested', { toolId, toolCall: next });
  }

  recordUsage(costUsd: number): void {
    if (!Number.isFinite(costUsd) || costUsd < 0) throw new Error('Cost must be a non-negative finite number');
    const next = Number((this.snapshot.costUsd + costUsd).toFixed(6));
    if (next > this.limits.maximumCostUsd) return void this.transition('limit_exceeded', { limit: 'maximumCostUsd', costUsd: next });
    this.snapshot = { ...this.snapshot, costUsd: next };
    this.append('usage_recorded', { costUsd, totalCostUsd: next });
  }

  enforceTimeout(now = Date.now()): void {
    if (!terminalStates.has(this.snapshot.state) && now - this.snapshot.startedAt > this.limits.timeoutMs) {
      this.transition('timed_out', { elapsedMs: now - this.snapshot.startedAt });
    }
  }

  requestApproval(toolCallId: string, reason: string): void {
    this.transition('waiting_for_approval', { toolCallId, reason });
    this.append('approval_requested', { toolCallId, reason });
  }

  decideApproval(toolCallId: string, decision: 'approved' | 'denied', reviewerId: string, reason?: string): void {
    if (this.snapshot.state !== 'waiting_for_approval') throw new Error('Execution is not awaiting approval');
    this.append('approval_decided', { toolCallId, decision, reviewerId, reason });
    this.transition(decision === 'approved' ? 'running' : 'approval_denied', { toolCallId, reviewerId, reason });
  }

  private assertActive(): void {
    if (terminalStates.has(this.snapshot.state)) throw new Error(`Execution is terminal: ${this.snapshot.state}`);
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
