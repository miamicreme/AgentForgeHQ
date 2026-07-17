import { describe, expect, it } from 'vitest';
import { agentRecordSchema, assertTransition, assertVersionMutable, canTransition } from '../src/index';

describe('registry-core', () => {
  it('accepts valid lifecycle transitions', () => {
    expect(canTransition('draft', 'testing')).toBe(true);
    expect(canTransition('approved', 'published')).toBe(true);
  });

  it('rejects invalid lifecycle transitions', () => {
    expect(() => assertTransition('draft', 'published')).toThrow(/Invalid agent status transition/);
  });

  it('protects published versions from mutation', () => {
    expect(() => assertVersionMutable('published')).toThrow(/immutable/);
    expect(() => assertVersionMutable('draft')).not.toThrow();
  });

  it('rejects unsafe slugs and unknown fields', () => {
    const result = agentRecordSchema.safeParse({
      id: crypto.randomUUID(),
      workspaceId: crypto.randomUUID(),
      name: 'Repository Delivery Agent',
      slug: 'Repository Delivery Agent',
      description: '',
      status: 'draft',
      currentVersionId: null,
      createdBy: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      unexpected: true,
    });
    expect(result.success).toBe(false);
  });
});
