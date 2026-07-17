import { describe, expect, it } from 'vitest'
import { assertPublishable, evaluateReleaseCandidate } from '../src/index.js'

const candidate = {
  agentVersionId: '11111111-1111-4111-8111-111111111111',
  specificationValid: true,
  permissionsApproved: true,
  requiredEvaluationsPassed: true,
  reviewerApproved: true,
  unresolvedCriticalFindings: 0,
  rollbackPlanPresent: true,
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
  it('reports every failed gate', () => {
    expect(() => assertPublishable({...candidate, reviewerApproved:false, rollbackPlanPresent:false})).toThrow(/REVIEW_COMPLETE, ROLLBACK_READY/)
  })
})
