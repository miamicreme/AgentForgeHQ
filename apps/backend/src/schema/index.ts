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

const typeDefs = [baseSchema, agentSchema].join('\n');

export default typeDefs;
