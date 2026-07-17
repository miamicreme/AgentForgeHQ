import { describe, expect, it } from 'vitest'
import {
  authorizeWorkspaceAction,
  isWorkspaceAction,
  isWorkspaceRole,
  requireWorkspaceAction,
} from '../src/index.js'

const base = { userId: 'user-1', workspaceId: 'workspace-1' }

describe('workspace authorization', () => {
  it('denies unauthenticated and blank identities', () => {
    expect(authorizeWorkspaceAction({ userId: null, workspaceId: 'workspace-1', role: 'owner' }, 'agent:create'))
      .toEqual({ allowed: false, reason: 'unauthenticated' })
    expect(authorizeWorkspaceAction({ userId: '   ', workspaceId: 'workspace-1', role: 'owner' }, 'agent:create'))
      .toEqual({ allowed: false, reason: 'unauthenticated' })
  })

  it('denies blank workspace identifiers', () => {
    expect(authorizeWorkspaceAction({ userId: 'user-1', workspaceId: ' ', role: 'owner' }, 'agent:create'))
      .toEqual({ allowed: false, reason: 'workspace_required' })
  })

  it('validates roles and actions at runtime boundaries', () => {
    expect(isWorkspaceRole('reviewer')).toBe(true)
    expect(isWorkspaceRole('admin')).toBe(false)
    expect(isWorkspaceAction('approval:decide')).toBe(true)
    expect(isWorkspaceAction('approval:delete')).toBe(false)
  })

  it('allows builders to create agents and manage evaluations', () => {
    expect(authorizeWorkspaceAction({ ...base, role: 'builder' }, 'agent:create').allowed).toBe(true)
    expect(authorizeWorkspaceAction({ ...base, role: 'builder' }, 'evaluation:manage').allowed).toBe(true)
  })

  it('prevents builders from publishing or deciding approvals', () => {
    expect(authorizeWorkspaceAction({ ...base, role: 'builder' }, 'agent:publish').allowed).toBe(false)
    expect(authorizeWorkspaceAction({ ...base, role: 'builder' }, 'approval:decide').allowed).toBe(false)
  })

  it('allows reviewers to publish and decide approvals but not modify drafts', () => {
    expect(authorizeWorkspaceAction({ ...base, role: 'reviewer' }, 'agent:publish').allowed).toBe(true)
    expect(authorizeWorkspaceAction({ ...base, role: 'reviewer' }, 'approval:decide').allowed).toBe(true)
    expect(authorizeWorkspaceAction({ ...base, role: 'reviewer' }, 'agent:update').allowed).toBe(false)
  })

  it('keeps viewers read only', () => {
    expect(authorizeWorkspaceAction({ ...base, role: 'viewer' }, 'agent:read').allowed).toBe(true)
    expect(authorizeWorkspaceAction({ ...base, role: 'viewer' }, 'evaluation:read').allowed).toBe(true)
    expect(authorizeWorkspaceAction({ ...base, role: 'viewer' }, 'agent:create').allowed).toBe(false)
  })

  it('throws a typed error when enforcement fails', () => {
    expect(() => requireWorkspaceAction({ ...base, role: 'viewer' }, 'agent:create')).toThrow(/insufficient_role/)
  })
})
