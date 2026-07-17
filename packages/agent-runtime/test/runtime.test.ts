import { describe, expect, it } from 'vitest';
import { ExecutionRuntime } from '../src/index';

const limits = { maximumSteps: 2, maximumToolCalls: 1, maximumCostUsd: 1, timeoutMs: 1_000 };

function runningRuntime(id: string, now = 0) {
  const runtime = new ExecutionRuntime(id, limits, now);
  runtime.transition('validating');
  runtime.transition('compiling');
  runtime.transition('running');
  return runtime;
}

describe('ExecutionRuntime', () => {
  it('follows the golden execution path', () => {
    const runtime = runningRuntime('exec-1');
    runtime.recordStep('model');
    runtime.recordToolCall('github-read');
    runtime.requestApproval('call-1', 'Read private repository');
    runtime.decideApproval('call-1', 'approved', 'reviewer-1', 'Approved for this repository');
    runtime.transition('evaluating');
    runtime.transition('completed');
    expect(runtime.current.state).toBe('completed');
    expect(runtime.current.events.map((event) => event.sequence)).toEqual([...runtime.current.events.keys()].map((i) => i + 1));
    expect(runtime.current.events.filter((event) => event.type === 'state_changed').map((event) => event.data.from)).toEqual([
      'queued', 'validating', 'compiling', 'running', 'waiting_for_approval', 'running', 'evaluating',
    ]);
  });

  it('fails closed on invalid transitions', () => {
    const runtime = new ExecutionRuntime('exec-2', limits);
    expect(() => runtime.transition('completed')).toThrow(/Invalid execution transition/);
  });

  it('stops when a tool-call limit is exceeded', () => {
    const runtime = runningRuntime('exec-3');
    runtime.recordToolCall('one');
    runtime.recordToolCall('two');
    expect(runtime.current.state).toBe('limit_exceeded');
  });

  it('records denied approvals as terminal', () => {
    const runtime = runningRuntime('exec-4');
    runtime.requestApproval('call-2', 'Write file');
    runtime.decideApproval('call-2', 'denied', 'reviewer-2', 'Scope not approved');
    expect(runtime.current.state).toBe('approval_denied');
  });

  it('rejects a decision for the wrong tool call', () => {
    const runtime = runningRuntime('exec-5');
    runtime.requestApproval('call-expected', 'Write file');
    expect(() => runtime.decideApproval('call-other', 'approved', 'reviewer-1', 'Approved')).toThrow(/does not match/);
  });

  it('times out from pre-running states at the exact limit', () => {
    const runtime = new ExecutionRuntime('exec-6', limits, 0);
    runtime.enforceTimeout(1_000);
    expect(runtime.current.state).toBe('timed_out');
  });

  it('blocks usage mutation after completion', () => {
    const runtime = runningRuntime('exec-7');
    runtime.transition('evaluating');
    runtime.transition('completed');
    expect(() => runtime.recordUsage(0.1)).toThrow(/terminal/);
  });

  it('validates execution limits at construction', () => {
    expect(() => new ExecutionRuntime('exec-8', { ...limits, maximumSteps: 0 })).toThrow(/maximumSteps/);
    expect(() => new ExecutionRuntime('exec-9', { ...limits, maximumCostUsd: Number.NaN })).toThrow(/maximumCostUsd/);
  });
});
