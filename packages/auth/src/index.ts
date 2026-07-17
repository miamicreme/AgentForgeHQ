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
] as const
export type WorkspaceAction = (typeof WorkspaceActions)[number]

const permissions: Readonly<Record<WorkspaceRole, readonly WorkspaceAction[]>> = Object.freeze({
  owner: WorkspaceActions,
  builder: ['workspace:read', 'agent:read', 'agent:create', 'agent:update'],
  reviewer: ['workspace:read', 'agent:read', 'agent:review', 'agent:publish'],
  viewer: ['workspace:read', 'agent:read'],
})

export type AuthorizationContext = Readonly<{
  userId: string | null
  workspaceId: string | null
  role: WorkspaceRole | null
}>

export type AuthorizationDecision = Readonly<{
  allowed: boolean
  reason: 'allowed' | 'unauthenticated' | 'workspace_required' | 'membership_required' | 'insufficient_role'
}>

export function authorizeWorkspaceAction(
  context: AuthorizationContext,
  action: WorkspaceAction,
): AuthorizationDecision {
  if (!context.userId) return Object.freeze({ allowed: false, reason: 'unauthenticated' })
  if (!context.workspaceId) return Object.freeze({ allowed: false, reason: 'workspace_required' })
  if (!context.role) return Object.freeze({ allowed: false, reason: 'membership_required' })

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
