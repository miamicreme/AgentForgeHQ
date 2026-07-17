import { describe, expect, it } from 'vitest'
import {
  AgentSpecificationSchema,
  compileAgentSpecification,
  semanticDiff,
} from '../src/index.js'

const validSpec = {
  schemaVersion: '1.0',
  identity: {
    name: 'Repository Delivery Agent',
    slug: 'repository-delivery-agent',
    description: 'Inspects repositories and produces evidence-backed delivery recommendations.',
    type: 'workflow',
  },
  objective: {
    primary: 'Produce a verified repository assessment and bounded delivery plan.',
    successCriteria: ['Repository structure identified', 'Evidence attached to every completion claim'],
  },
  instructions: {
    system: ['Inspect before changing anything', 'Never claim success without verification'],
  },
  skills: ['production-readiness', 'repository-inspection'],
  tools: {
    allowed: ['github-read', 'repository-files'],
    forbidden: ['production-deploy'],
  },
  limits: {
    maximumSteps: 50,
    maximumToolCalls: 30,
    maximumCostUsd: 5,
    executionTimeoutSeconds: 900,
  },
  approvalPolicy: {
    requiredFor: ['command_execution'],
  },
  evaluationPolicy: {
    requiredSuite: 'repository-delivery-v1',
    minimumScore: 0.85,
  },
} as const

describe('AgentSpecification', () => {
  it('accepts a valid specification', () => {
    expect(AgentSpecificationSchema.parse(validSpec).identity.slug).toBe('repository-delivery-agent')
  })

  it('rejects unknown top-level fields', () => {
    expect(() => AgentSpecificationSchema.parse({ ...validSpec, secret: 'nope' })).toThrow()
  })

  it('rejects tools that are both allowed and forbidden', () => {
    expect(() =>
      AgentSpecificationSchema.parse({
        ...validSpec,
        tools: { allowed: ['github-read'], forbidden: ['github-read'] },
      }),
    ).toThrow(/both allowed and forbidden/)
  })

  it('compiles deterministically regardless of skill ordering', () => {
    const first = compileAgentSpecification(validSpec)
    const second = compileAgentSpecification({
      ...validSpec,
      skills: [...validSpec.skills].reverse(),
    })
    expect(first).toEqual(second)
  })

  it('reports semantic changes at stable paths', () => {
    const changes = semanticDiff(validSpec, {
      ...validSpec,
      limits: { ...validSpec.limits, maximumCostUsd: 10 },
    })
    expect(changes).toEqual([
      {
        path: 'limits',
        before: validSpec.limits,
        after: { ...validSpec.limits, maximumCostUsd: 10 },
      },
    ])
  })
})
