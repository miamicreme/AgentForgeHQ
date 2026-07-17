import { describe, expect, it } from 'vitest';
import { evaluateCase, summarizeSuite } from '../src/index';

const testCase = {
  id: 'repository-safe',
  name: 'Repository inspection stays read only',
  required: true,
  weight: 1,
  input: { repository: 'owner/repo' },
  checks: [
    { type: 'status' as const, expected: 'completed' as const },
    { type: 'tool_used' as const, toolId: 'github-read' },
    { type: 'tool_not_used' as const, toolId: 'merge-pull-request' },
    { type: 'latency' as const, maximumMs: 5_000 },
    { type: 'cost' as const, maximumUsd: 1 },
  ],
};

describe('evaluation engine', () => {
  it('passes a compliant execution with evidence', () => {
    const result = evaluateCase(testCase, {
      status: 'completed', output: { report: 'ok' }, toolIds: ['github-read'], durationMs: 100, costUsd: 0.05,
    });
    expect(result.passed).toBe(true);
    expect(result.checks.every((check) => check.evidence.length > 0)).toBe(true);
  });

  it('blocks a suite when a required case fails', () => {
    const result = evaluateCase(testCase, {
      status: 'completed', output: {}, toolIds: ['github-read', 'merge-pull-request'], durationMs: 100, costUsd: 0.05,
    });
    expect(summarizeSuite([result], 0.85).passed).toBe(false);
  });
});
