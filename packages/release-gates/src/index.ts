import { z } from 'zod'

const EvidenceReferenceSchema = z.object({
  kind: z.enum(['evaluation', 'security_review', 'permission_review', 'rollback_plan']),
  referenceId: z.string().trim().min(1).max(200),
  recordedAt: z.string().datetime(),
}).strict()

export const releaseCandidateSchema = z.object({
  agentVersionId: z.string().uuid(),
  specificationValid: z.boolean(),
  permissionsApproved: z.boolean(),
  requiredEvaluationsPassed: z.boolean(),
  evaluationScore: z.number().finite().min(0).max(1).default(1),
  minimumEvaluationScore: z.number().finite().min(0).max(1).default(0.85),
  reviewerApproved: z.boolean(),
  reviewerId: z.string().trim().min(1).max(200).optional(),
  reviewedAt: z.string().datetime().optional(),
  unresolvedCriticalFindings: z.number().int().nonnegative(),
  rollbackPlanPresent: z.boolean(),
  evidence: z.array(EvidenceReferenceSchema).default([]),
}).strict().superRefine((candidate, ctx) => {
  if (candidate.reviewerApproved && (!candidate.reviewerId || !candidate.reviewedAt)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['reviewerId'], message: 'Approved releases require reviewer identity and timestamp' })
  }
  if (candidate.requiredEvaluationsPassed && candidate.evaluationScore < candidate.minimumEvaluationScore) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['evaluationScore'], message: 'Evaluation score is below the release minimum' })
  }
})

export type ReleaseCandidate = z.infer<typeof releaseCandidateSchema>
export type GateFinding = Readonly<{code:string; passed:boolean; message:string}>
export type ReleaseDecision = Readonly<{passed:boolean; findings:readonly GateFinding[]}>

export function evaluateReleaseCandidate(input: unknown): ReleaseDecision {
  const candidate = releaseCandidateSchema.parse(input)
  const evidenceKinds = new Set(candidate.evidence.map((item) => item.kind))
  const findings: GateFinding[] = [
    { code:'SPEC_VALID', passed:candidate.specificationValid, message:'Agent Specification must be valid.' },
    { code:'PERMISSIONS_APPROVED', passed:candidate.permissionsApproved, message:'Tool and data permissions must be approved.' },
    { code:'EVALUATIONS_PASSED', passed:candidate.requiredEvaluationsPassed && candidate.evaluationScore >= candidate.minimumEvaluationScore, message:'All required evaluations must pass at or above the minimum score.' },
    { code:'REVIEW_COMPLETE', passed:candidate.reviewerApproved && Boolean(candidate.reviewerId && candidate.reviewedAt), message:'An authorized reviewer must approve the release with identity and timestamp.' },
    { code:'NO_CRITICAL_FINDINGS', passed:candidate.unresolvedCriticalFindings === 0, message:'Critical findings must be resolved.' },
    { code:'ROLLBACK_READY', passed:candidate.rollbackPlanPresent, message:'A rollback plan is required.' },
    { code:'EVIDENCE_COMPLETE', passed:['evaluation','security_review','permission_review','rollback_plan'].every((kind) => evidenceKinds.has(kind as EvidenceReference['kind'])), message:'Release evidence must cover evaluation, security, permissions, and rollback.' },
  ]
  return Object.freeze({ passed: findings.every((finding) => finding.passed), findings: Object.freeze(findings.map(Object.freeze)) })
}

type EvidenceReference = z.infer<typeof EvidenceReferenceSchema>

export function assertPublishable(input: unknown): ReleaseDecision {
  const decision = evaluateReleaseCandidate(input)
  if (!decision.passed) {
    const failed = decision.findings.filter((finding) => !finding.passed).map((finding) => finding.code).join(', ')
    throw new Error(`Release blocked: ${failed}`)
  }
  return decision
}
