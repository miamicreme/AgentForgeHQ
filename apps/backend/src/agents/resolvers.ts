import { Agent } from './types';
import { defaultAgentName } from './config';

const agents: Agent[] = [];

const resolvers = {
  Query: {
    agent: (_: unknown, { id }: { id: string }) =>
      agents.find((a) => a.id === id) || null,
  },
  Mutation: {
    createAgent: (_: unknown, { name }: { name?: string }) => {
      const agent: Agent = { id: String(Date.now()), name: name || defaultAgentName };
      agents.push(agent);
      return agent;
    },
  },
};

export default resolvers;
