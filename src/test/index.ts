import { ApolloServer } from 'apollo-server';
import dotenv from 'dotenv';
import { startServer } from '../server-config';

dotenv.config({ path: './test.env' });

describe('Starting tests', () => {
  let server: ApolloServer;

  before(
    async (): Promise<void> => {
      server = await startServer();
    },
  );

  require('./mutation-create-user');
  require('./query-user');
  require('./query-users');

  after(
    async (): Promise<void> => {
      await server.stop();
    },
  );
});
