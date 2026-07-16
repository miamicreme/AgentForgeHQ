import { readFileSync } from 'fs';
import { join } from 'path';

const baseSchema = `
  type Query {
    ping: String
  }
`;

const agentSchema = readFileSync(
  join(__dirname, '../agents/schema.graphql'),
  'utf8'
);

const skipTraceSchema = readFileSync(
  join(__dirname, '../agents/SkipTraceEnricher/schema.graphql'),
  'utf8'
);

const typeDefs = [baseSchema, agentSchema, skipTraceSchema].join('\n');

export default typeDefs;
