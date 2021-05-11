import { ApolloServer } from 'apollo-server';
import dotenv from 'dotenv';
import { createConnection } from 'typeorm';
import { User } from './entity/User';
import { formatError } from './error';
import { typeDefs, resolvers } from './schema';

export async function startServer(): Promise<ApolloServer> {
  const path: string = process.env.TEST === 'OK' ? './test.env' : './.env';
  dotenv.config({ path });

  const server = new ApolloServer({
    typeDefs,
    resolvers,
    formatError,
    context: ({ req }) => {
      const token = req.headers.authorization || '';
      return { token };
    }
  });

  await createConnection({
    type: 'postgres',
    host: process.env.PS_HOST,
    port: +(process.env.PS_PORT ?? 5432),
    username: process.env.PS_USER,
    password: process.env.PS_PASSWORD,
    database: process.env.PS_DATABASE,
    synchronize: true,
    logging: false,
    entities: [User],
  });

  const response = await server.listen(4000);
  console.log(`Server ready at ${response.url}`);

  return server;
}
