import { ApolloServer } from 'apollo-server';
import { startServer } from '../server-config';

describe('Starting tests', () => {
  let server: ApolloServer;

  before(
    async (): Promise<void> => {
      server = await startServer();
    },
  );

  require('./mutation');
  require('./query');

  after(
    async (): Promise<void> => {
      await server.stop();
    },
  );
});
