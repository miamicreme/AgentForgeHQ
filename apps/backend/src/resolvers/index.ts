import agentResolvers from '../agents/resolvers';
import skipTraceResolvers from '../agents/SkipTraceEnricher/resolvers';

const resolvers = {
  Query: {
    ping: () => 'pong',
    ...(agentResolvers.Query || {}),
    ...(skipTraceResolvers.Query || {}),
  },
  Mutation: {
    ...(agentResolvers.Mutation || {}),
    ...(skipTraceResolvers.Mutation || {}),
  },
};

export default resolvers;
