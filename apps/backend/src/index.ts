import { ApolloServer } from 'apollo-server';
import dotenv from 'dotenv';
import typeDefs from './schema';
import resolvers from './resolvers';

dotenv.config();

const server = new ApolloServer({ typeDefs, resolvers });

const port = process.env.PORT ? Number(process.env.PORT) : 4000;

server.listen({ port }).then(({ url }) => {
  console.log(`🚀 Server ready at ${url}`);
});
