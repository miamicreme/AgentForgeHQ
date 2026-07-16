import { readFileSync } from 'fs';
import { join } from 'path';

// Simple helper to load the GraphQL schema
export function loadSchema(): string {
  return readFileSync(join(__dirname, 'schema.graphql'), 'utf8');
}
