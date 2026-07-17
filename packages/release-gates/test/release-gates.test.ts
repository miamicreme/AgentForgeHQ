import { describe, expect, it } from 'vitest'
import { assertPublishable, evaluateReleaseCandidate } from '../src/index.js'

const candidate = {
  agentVersionId: '11111111-1111-4111-8111-111111111111',
  specificationValid: true,
  permissionsApproved: true,
  requiredEvaluationsPassed: true,
  evaluationScore: 0.95,
  minimumEvaluationScore: 0.85,
  reviewerApproved: true,
  reviewerId: 'reviewer-1',
  reviewedAt: '2026-07-17T18:00:00Z',
  unresolvedCriticalFindings: 0,
  rollbackPlanPresent: true,
  evidence: [
    { kind:'evaluation' as const, referenceId:'eval-1', recordedAt:'2026-07-17T18:00:00Z' },
    { kind:'security_review' as const, referenceId:'security-1', recordedAt:'2026-07-17T18:00:00Z' },
    { kind:'permission_review' as const, referenceId:'permissions-1', recordedAt:'2026-07-17T18:00:00Z' },
    { kind:'rollback_plan' as const, referenceId:'rollback-1', recordedAt:'2026-07-17T18:00:00Z' },
  ],
}

describe('release gates', () => {
  it('passes a complete release candidate', () => {
    expect(assertPublishable(candidate).passed).toBe(true)
  })
  it('fails closed when evaluations fail', () => {
    const result = evaluateReleaseCandidate({...candidate, requiredEvaluationsPassed:false})
    expect(result.passed).toBe(false)
    expect(result.findings.find((finding) => finding.code === 'EVALUATIONS_PASSED')?.passed).toBe(false)
  })
  it('rejects an approved release without reviewer evidence', () => {
    expect(() => evaluateReleaseCandidate({...candidate, reviewerId:undefined})).toThrow(/reviewer identity/)
  })
  it('rejects scores below the configured release minimum', () => {
    expect(() => evaluateReleaseCandidate({...candidate, evaluationScore:0.8})).toThrow(/below the release minimum/)
  })
  it('blocks incomplete evidence sets', () => {
    const result = evaluateReleaseCandidate({...candidate, evidence:candidate.evidence.slice(0, 3)})
    expect(result.findings.find((finding) => finding.code === 'EVIDENCE_COMPLETE')?.passed).toBe(false)
  })
  it('reports every failed gate', () => {
    expect(() => assertPublishable({...candidate, reviewerApproved:false, rollbackPlanPresent:false})).toThrow(/REVIEW_COMPLETE, ROLLBACK_READY/)
  })
})
