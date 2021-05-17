import { ApolloServer } from 'apollo-server';
import { connectDb } from './connect-db';
import { formatError } from './error';
import { typeDefs, resolvers } from './schema';

export async function startServer(): Promise<ApolloServer> {
  const server = new ApolloServer({
    typeDefs,
    resolvers,
    formatError,
    context: ({ req }) => {
      const token = req.headers.authorization || '';
      return { token };
    },
  });

  await connectDb();

  const response = await server.listen(process.env.SERVER_PORT);
  console.log(`Server ready at ${response.url}`);

  return server;
}
