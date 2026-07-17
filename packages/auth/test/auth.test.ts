import { describe, expect, it } from 'vitest'
import { authorizeWorkspaceAction, requireWorkspaceAction } from '../src/index.js'

const base = { userId: 'user-1', workspaceId: 'workspace-1' }

describe('workspace authorization', () => {
  it('denies unauthenticated requests', () => {
    expect(
      authorizeWorkspaceAction({ userId: null, workspaceId: 'workspace-1', role: 'owner' }, 'agent:create'),
    ).toEqual({ allowed: false, reason: 'unauthenticated' })
  })

  it('allows builders to create agents', () => {
    expect(authorizeWorkspaceAction({ ...base, role: 'builder' }, 'agent:create')).toEqual({
      allowed: true,
      reason: 'allowed',
    })
  })

  it('prevents builders from publishing', () => {
    expect(authorizeWorkspaceAction({ ...base, role: 'builder' }, 'agent:publish')).toEqual({
      allowed: false,
      reason: 'insufficient_role',
    })
  })

  it('allows reviewers to publish but not modify drafts', () => {
    expect(authorizeWorkspaceAction({ ...base, role: 'reviewer' }, 'agent:publish').allowed).toBe(true)
    expect(authorizeWorkspaceAction({ ...base, role: 'reviewer' }, 'agent:update').allowed).toBe(false)
  })

  it('throws a typed error when enforcement fails', () => {
    expect(() => requireWorkspaceAction({ ...base, role: 'viewer' }, 'agent:create')).toThrow(
      /insufficient_role/,
    )
  })
})
