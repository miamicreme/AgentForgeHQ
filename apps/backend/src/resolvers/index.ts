import agentResolvers from '../agents/resolvers';

const resolvers = {
  Query: {
    ping: () => 'pong',
    ...(agentResolvers.Query || {}),
  },
  Mutation: {
    ...(agentResolvers.Mutation || {}),
  },
};

export default resolvers;
