import { ApolloServer } from 'apollo-server';
import resolvers from './resolvers';
import { loadSchema } from './tool';

const typeDefs = loadSchema();

const server = new ApolloServer({ typeDefs, resolvers });

const port = process.env.PORT ? Number(process.env.PORT) : 4000;

server.listen({ port }).then(({ url }) => {
  console.log(`🚀 SkipTraceEnricher ready at ${url}`);
});
