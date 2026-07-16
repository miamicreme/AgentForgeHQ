import { describe, expect, it } from 'vitest';
import { agentSchema } from '../validation/agentSchema';

describe('agentSchema', () => {
  it('throws when name is missing', () => {
    expect(() => agentSchema.parse({})).toThrow();
  });

  it('parses valid input', () => {
    expect(agentSchema.parse({ name: 'Test' })).toEqual({ name: 'Test' });
  });
});
