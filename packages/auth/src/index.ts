export const WorkspaceRoles = ['owner', 'builder', 'reviewer', 'viewer'] as const
export type WorkspaceRole = (typeof WorkspaceRoles)[number]

export const WorkspaceActions = [
  'workspace:read',
  'workspace:manage',
  'agent:read',
  'agent:create',
  'agent:update',
  'agent:review',
  'agent:publish',
  'approval:read',
  'approval:decide',
  'evaluation:read',
  'evaluation:manage',
] as const
export type WorkspaceAction = (typeof WorkspaceActions)[number]

const permissions: Readonly<Record<WorkspaceRole, readonly WorkspaceAction[]>> = Object.freeze({
  owner: WorkspaceActions,
  builder: [
    'workspace:read', 'agent:read', 'agent:create', 'agent:update',
    'approval:read', 'evaluation:read', 'evaluation:manage',
  ],
  reviewer: [
    'workspace:read', 'agent:read', 'agent:review', 'agent:publish',
    'approval:read', 'approval:decide', 'evaluation:read',
  ],
  viewer: ['workspace:read', 'agent:read', 'evaluation:read'],
})

export type AuthorizationContext = Readonly<{
  userId: string | null
  workspaceId: string | null
  role: WorkspaceRole | null
}>

export type AuthorizationDecision = Readonly<{
  allowed: boolean
  reason: 'allowed' | 'unauthenticated' | 'workspace_required' | 'membership_required' | 'invalid_role' | 'insufficient_role'
}>

export function isWorkspaceRole(value: unknown): value is WorkspaceRole {
  return typeof value === 'string' && (WorkspaceRoles as readonly string[]).includes(value)
}

export function isWorkspaceAction(value: unknown): value is WorkspaceAction {
  return typeof value === 'string' && (WorkspaceActions as readonly string[]).includes(value)
}

export function authorizeWorkspaceAction(
  context: AuthorizationContext,
  action: WorkspaceAction,
): AuthorizationDecision {
  if (!context.userId?.trim()) return Object.freeze({ allowed: false, reason: 'unauthenticated' })
  if (!context.workspaceId?.trim()) return Object.freeze({ allowed: false, reason: 'workspace_required' })
  if (!context.role) return Object.freeze({ allowed: false, reason: 'membership_required' })
  if (!isWorkspaceRole(context.role)) return Object.freeze({ allowed: false, reason: 'invalid_role' })

  const allowed = permissions[context.role].includes(action)
  return Object.freeze({
    allowed,
    reason: allowed ? 'allowed' : 'insufficient_role',
  })
}

export class AuthorizationError extends Error {
  readonly code = 'AUTHORIZATION_DENIED'

  constructor(readonly decision: AuthorizationDecision) {
    super(`Workspace action denied: ${decision.reason}`)
    this.name = 'AuthorizationError'
  }
}

export function requireWorkspaceAction(
  context: AuthorizationContext,
  action: WorkspaceAction,
): void {
  const decision = authorizeWorkspaceAction(context, action)
  if (!decision.allowed) throw new AuthorizationError(decision)
}
