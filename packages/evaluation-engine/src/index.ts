import { z } from 'zod';

export const evaluationCaseSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(2).max(120),
  required: z.boolean().default(true),
  weight: z.number().positive().max(100).default(1),
  input: z.unknown(),
  checks: z.array(z.discriminatedUnion('type', [
    z.object({ type: z.literal('status'), expected: z.enum(['completed', 'failed']) }),
    z.object({ type: z.literal('contains'), path: z.string().min(1), expected: z.string() }),
    z.object({ type: z.literal('tool_used'), toolId: z.string().min(1) }),
    z.object({ type: z.literal('tool_not_used'), toolId: z.string().min(1) }),
    z.object({ type: z.literal('latency'), maximumMs: z.number().int().positive() }),
    z.object({ type: z.literal('cost'), maximumUsd: z.number().nonnegative() }),
  ])).min(1),
}).strict();

export type EvaluationCase = z.infer<typeof evaluationCaseSchema>;
export interface EvaluationExecution {
  status: 'completed' | 'failed';
  output: unknown;
  toolIds: readonly string[];
  durationMs: number;
  costUsd: number;
}
export interface CheckResult { passed: boolean; check: EvaluationCase['checks'][number]; evidence: string; }
export interface EvaluationResult { caseId: string; passed: boolean; score: number; required: boolean; checks: readonly CheckResult[]; }

function readPath(value: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((current, key) => {
    if (current && typeof current === 'object' && key in current) return (current as Record<string, unknown>)[key];
    return undefined;
  }, value);
}

export function evaluateCase(input: unknown, execution: EvaluationExecution): EvaluationResult {
  const test = evaluationCaseSchema.parse(input);
  const checks = test.checks.map<CheckResult>((check) => {
    switch (check.type) {
      case 'status': return { passed: execution.status === check.expected, check, evidence: `status=${execution.status}` };
      case 'contains': {
        const actual = readPath(execution.output, check.path);
        const passed = typeof actual === 'string' && actual.includes(check.expected);
        return { passed, check, evidence: `${check.path}=${JSON.stringify(actual)}` };
      }
      case 'tool_used': return { passed: execution.toolIds.includes(check.toolId), check, evidence: `tools=${execution.toolIds.join(',')}` };
      case 'tool_not_used': return { passed: !execution.toolIds.includes(check.toolId), check, evidence: `tools=${execution.toolIds.join(',')}` };
      case 'latency': return { passed: execution.durationMs <= check.maximumMs, check, evidence: `durationMs=${execution.durationMs}` };
      case 'cost': return { passed: execution.costUsd <= check.maximumUsd, check, evidence: `costUsd=${execution.costUsd}` };
    }
  });
  const passedCount = checks.filter((check) => check.passed).length;
  return { caseId: test.id, passed: passedCount === checks.length, score: Number((passedCount / checks.length).toFixed(4)), required: test.required, checks };
}

export function summarizeSuite(results: readonly EvaluationResult[], minimumScore: number) {
  if (results.length === 0) throw new Error('Evaluation suite requires at least one result');
  const requiredPassed = results.filter((result) => result.required).every((result) => result.passed);
  const score = Number((results.reduce((sum, result) => sum + result.score, 0) / results.length).toFixed(4));
  return { passed: requiredPassed && score >= minimumScore, score, requiredPassed, total: results.length };
}
