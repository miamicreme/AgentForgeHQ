import { z } from 'zod'

const Identifier = z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
const NonBlank = (min: number, max: number) => z.string().trim().min(min).max(max)
const UniqueIdentifiers = z.array(Identifier).max(50).transform((items) => [...new Set(items)])

export const AgentSpecificationSchema = z
  .object({
    schemaVersion: z.literal('1.0'),
    identity: z.object({
      name: NonBlank(2, 120),
      slug: Identifier,
      description: NonBlank(10, 500),
      type: z.enum(['specialist', 'workflow', 'supervisor']),
    }).strict(),
    objective: z.object({
      primary: NonBlank(10, 1000),
      successCriteria: z.array(NonBlank(3, 300)).min(1).max(20).transform((items) => [...new Set(items)]),
    }).strict(),
    instructions: z.object({
      system: z.array(NonBlank(3, 1000)).min(1).max(50).transform((items) => [...new Set(items)]),
    }).strict(),
    skills: UniqueIdentifiers.default([]),
    tools: z.object({
      allowed: UniqueIdentifiers.default([]),
      forbidden: UniqueIdentifiers.default([]),
    }).strict(),
    limits: z.object({
      maximumSteps: z.number().int().positive().max(500).default(50),
      maximumToolCalls: z.number().int().nonnegative().max(500).default(30),
      maximumCostUsd: z.number().finite().nonnegative().max(1000).default(5),
      executionTimeoutSeconds: z.number().int().positive().max(86_400).default(900),
    }).strict(),
    approvalPolicy: z.object({
      requiredFor: z.array(
        z.enum(['file_write', 'command_execution', 'pull_request_creation', 'external_message', 'deployment']),
      ).transform((items) => [...new Set(items)]),
    }).strict(),
    evaluationPolicy: z.object({
      requiredSuite: Identifier,
      minimumScore: z.number().finite().min(0).max(1),
    }).strict(),
  })
  .strict()
  .superRefine((spec, ctx) => {
    const forbidden = new Set(spec.tools.forbidden)
    for (const tool of spec.tools.allowed) {
      if (forbidden.has(tool)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['tools', 'allowed'],
          message: `Tool '${tool}' cannot be both allowed and forbidden`,
        })
      }
    }
    if (spec.limits.maximumToolCalls > spec.limits.maximumSteps) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['limits', 'maximumToolCalls'],
        message: 'maximumToolCalls cannot exceed maximumSteps',
      })
    }
  })

export type AgentSpecification = z.infer<typeof AgentSpecificationSchema>

export type CompiledAgent = Readonly<{
  schemaVersion: '1.0'
  identity: AgentSpecification['identity']
  instructionText: string
  skills: readonly string[]
  allowedTools: readonly string[]
  forbiddenTools: readonly string[]
  limits: AgentSpecification['limits']
  approvalPolicy: AgentSpecification['approvalPolicy']
  evaluationPolicy: AgentSpecification['evaluationPolicy']
}>

export function parseAgentSpecification(input: unknown): AgentSpecification {
  return AgentSpecificationSchema.parse(input)
}

export function compileAgentSpecification(input: unknown): CompiledAgent {
  const spec = parseAgentSpecification(input)
  return Object.freeze({
    schemaVersion: spec.schemaVersion,
    identity: Object.freeze({ ...spec.identity }),
    instructionText: [
      `Primary objective: ${spec.objective.primary}`,
      'Success criteria:',
      ...spec.objective.successCriteria.map((criterion, index) => `${index + 1}. ${criterion}`),
      'Operating instructions:',
      ...spec.instructions.system.map((instruction, index) => `${index + 1}. ${instruction}`),
    ].join('\n'),
    skills: Object.freeze([...spec.skills].sort()),
    allowedTools: Object.freeze([...spec.tools.allowed].sort()),
    forbiddenTools: Object.freeze([...spec.tools.forbidden].sort()),
    limits: Object.freeze({ ...spec.limits }),
    approvalPolicy: Object.freeze({ requiredFor: Object.freeze([...spec.approvalPolicy.requiredFor].sort()) }),
    evaluationPolicy: Object.freeze({ ...spec.evaluationPolicy }),
  })
}

export type SemanticChange = Readonly<{
  path: string
  before: unknown
  after: unknown
}>

export function semanticDiff(beforeInput: unknown, afterInput: unknown): SemanticChange[] {
  const before = compileAgentSpecification(beforeInput)
  const after = compileAgentSpecification(afterInput)
  const changes: SemanticChange[] = []

  const compare = (path: string, left: unknown, right: unknown): void => {
    if (JSON.stringify(left) !== JSON.stringify(right)) {
      changes.push(Object.freeze({ path, before: left, after: right }))
    }
  }

  compare('identity', before.identity, after.identity)
  compare('instructionText', before.instructionText, after.instructionText)
  compare('skills', before.skills, after.skills)
  compare('allowedTools', before.allowedTools, after.allowedTools)
  compare('forbiddenTools', before.forbiddenTools, after.forbiddenTools)
  compare('limits', before.limits, after.limits)
  compare('approvalPolicy', before.approvalPolicy, after.approvalPolicy)
  compare('evaluationPolicy', before.evaluationPolicy, after.evaluationPolicy)

  return changes
}
