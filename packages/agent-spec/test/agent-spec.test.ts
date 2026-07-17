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

  it('rejects unknown fields at nested boundaries', () => {
    expect(() => AgentSpecificationSchema.parse({ ...validSpec, secret: 'nope' })).toThrow()
    expect(() => AgentSpecificationSchema.parse({ ...validSpec, identity: { ...validSpec.identity, secret: 'nope' } })).toThrow()
  })

  it('rejects tools that are both allowed and forbidden', () => {
    expect(() => AgentSpecificationSchema.parse({
      ...validSpec,
      tools: { allowed: ['github-read'], forbidden: ['github-read'] },
    })).toThrow(/both allowed and forbidden/)
  })

  it('rejects tool-call limits that exceed total steps', () => {
    expect(() => AgentSpecificationSchema.parse({
      ...validSpec,
      limits: { ...validSpec.limits, maximumSteps: 5, maximumToolCalls: 6 },
    })).toThrow(/cannot exceed maximumSteps/)
  })

  it('normalizes whitespace and removes duplicate capabilities', () => {
    const parsed = AgentSpecificationSchema.parse({
      ...validSpec,
      identity: { ...validSpec.identity, name: '  Repository Delivery Agent  ' },
      skills: ['repository-inspection', 'repository-inspection'],
      tools: { ...validSpec.tools, allowed: ['github-read', 'github-read'] },
    })
    expect(parsed.identity.name).toBe('Repository Delivery Agent')
    expect(parsed.skills).toEqual(['repository-inspection'])
    expect(parsed.tools.allowed).toEqual(['github-read'])
  })

  it('rejects non-finite money and score values', () => {
    expect(() => AgentSpecificationSchema.parse({
      ...validSpec,
      limits: { ...validSpec.limits, maximumCostUsd: Number.NaN },
    })).toThrow()
    expect(() => AgentSpecificationSchema.parse({
      ...validSpec,
      evaluationPolicy: { ...validSpec.evaluationPolicy, minimumScore: Number.POSITIVE_INFINITY },
    })).toThrow()
  })

  it('compiles deterministically regardless of capability ordering', () => {
    const first = compileAgentSpecification(validSpec)
    const second = compileAgentSpecification({
      ...validSpec,
      skills: [...validSpec.skills].reverse(),
      tools: {
        allowed: [...validSpec.tools.allowed].reverse(),
        forbidden: [...validSpec.tools.forbidden].reverse(),
      },
    })
    expect(first).toEqual(second)
  })

  it('reports semantic changes at stable paths', () => {
    const changes = semanticDiff(validSpec, {
      ...validSpec,
      limits: { ...validSpec.limits, maximumCostUsd: 10 },
    })
    expect(changes).toEqual([{
      path: 'limits',
      before: validSpec.limits,
      after: { ...validSpec.limits, maximumCostUsd: 10 },
    }])
  })
})
