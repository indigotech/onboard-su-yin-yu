import { ApolloServer, gql } from 'apollo-server';

const typeDefs = gql`
  type Query {
    hello: String
  }
`;

const resolvers = {
  Query: {
    hello: () => {
      return 'Hello world!';
    }
  }
};

const server = new ApolloServer({ typeDefs, resolvers });

server.listen(4000).then((response) => {
    console.log(`Server ready at ${response.url}`);
});
