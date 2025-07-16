import { readFileSync } from 'fs';
import { join } from 'path';

export function loadSchema(): string {
  return readFileSync(join(__dirname, 'schema.graphql'), 'utf8');
}
