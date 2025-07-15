import { ApolloGateway } from '@apollo/gateway';
import { ApolloServer } from 'apollo-server';
import dotenv from 'dotenv';

dotenv.config();

async function loadSubgraphs() {
  const serviceUrl = process.env.AGENT_SERVICE_URL || 'http://backend:4000';
  try {
    const res = await fetch(`${serviceUrl}/agents/export`);
    const json = await res.json();
    return (json.data || []) as Array<{ name: string; url: string }>;
  } catch (err) {
    console.error('Failed to load subgraphs', err);
    return [];
  }
}

async function start() {
  const serviceList = await loadSubgraphs();
  const gateway = new ApolloGateway({ serviceList });
  const server = new ApolloServer({ gateway });
  const port = process.env.PORT ? Number(process.env.PORT) : 4001;
  server.listen({ port }).then(({ url }) => {
    console.log(`🚀 Gateway ready at ${url}`);
  });
}

start().catch((err) => {
  console.error('Gateway failed to start', err);
});
