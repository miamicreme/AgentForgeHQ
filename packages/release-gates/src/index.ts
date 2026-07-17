import { z } from 'zod'

export const releaseCandidateSchema = z.object({
  agentVersionId: z.string().uuid(),
  specificationValid: z.boolean(),
  permissionsApproved: z.boolean(),
  requiredEvaluationsPassed: z.boolean(),
  reviewerApproved: z.boolean(),
  unresolvedCriticalFindings: z.number().int().nonnegative(),
  rollbackPlanPresent: z.boolean(),
}).strict()

export type ReleaseCandidate = z.infer<typeof releaseCandidateSchema>
export type GateFinding = Readonly<{code:string; passed:boolean; message:string}>
export type ReleaseDecision = Readonly<{passed:boolean; findings:readonly GateFinding[]}>

export function evaluateReleaseCandidate(input: unknown): ReleaseDecision {
  const candidate = releaseCandidateSchema.parse(input)
  const findings: GateFinding[] = [
    { code:'SPEC_VALID', passed:candidate.specificationValid, message:'Agent Specification must be valid.' },
    { code:'PERMISSIONS_APPROVED', passed:candidate.permissionsApproved, message:'Tool and data permissions must be approved.' },
    { code:'EVALUATIONS_PASSED', passed:candidate.requiredEvaluationsPassed, message:'All required evaluations must pass.' },
    { code:'REVIEW_COMPLETE', passed:candidate.reviewerApproved, message:'An authorized reviewer must approve the release.' },
    { code:'NO_CRITICAL_FINDINGS', passed:candidate.unresolvedCriticalFindings === 0, message:'Critical findings must be resolved.' },
    { code:'ROLLBACK_READY', passed:candidate.rollbackPlanPresent, message:'A rollback plan is required.' },
  ]
  return Object.freeze({ passed: findings.every((finding) => finding.passed), findings: Object.freeze(findings.map(Object.freeze)) })
}

export function assertPublishable(input: unknown): ReleaseDecision {
  const decision = evaluateReleaseCandidate(input)
  if (!decision.passed) {
    const failed = decision.findings.filter((finding) => !finding.passed).map((finding) => finding.code).join(', ')
    throw new Error(`Release blocked: ${failed}`)
  }
  return decision
}
