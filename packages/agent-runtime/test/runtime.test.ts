import { describe, expect, it } from 'vitest';
import { ExecutionRuntime } from '../src/index';

const limits = { maximumSteps: 2, maximumToolCalls: 1, maximumCostUsd: 1, timeoutMs: 1_000 };

describe('ExecutionRuntime', () => {
  it('follows the golden execution path', () => {
    const runtime = new ExecutionRuntime('exec-1', limits, 0);
    runtime.transition('validating');
    runtime.transition('compiling');
    runtime.transition('running');
    runtime.recordStep('model');
    runtime.recordToolCall('github-read');
    runtime.requestApproval('call-1', 'Read private repository');
    runtime.decideApproval('call-1', 'approved', 'reviewer-1');
    runtime.transition('evaluating');
    runtime.transition('completed');
    expect(runtime.current.state).toBe('completed');
    expect(runtime.current.events.map((event) => event.sequence)).toEqual([...runtime.current.events.keys()].map((i) => i + 1));
  });

  it('fails closed on invalid transitions', () => {
    const runtime = new ExecutionRuntime('exec-2', limits);
    expect(() => runtime.transition('completed')).toThrow(/Invalid execution transition/);
  });

  it('stops when a tool-call limit is exceeded', () => {
    const runtime = new ExecutionRuntime('exec-3', limits);
    runtime.transition('validating');
    runtime.transition('compiling');
    runtime.transition('running');
    runtime.recordToolCall('one');
    runtime.recordToolCall('two');
    expect(runtime.current.state).toBe('limit_exceeded');
  });

  it('records denied approvals as terminal', () => {
    const runtime = new ExecutionRuntime('exec-4', limits);
    runtime.transition('validating');
    runtime.transition('compiling');
    runtime.transition('running');
    runtime.requestApproval('call-2', 'Write file');
    runtime.decideApproval('call-2', 'denied', 'reviewer-2', 'Scope not approved');
    expect(runtime.current.state).toBe('approval_denied');
  });
});
