import { ApolloServer, gql } from 'apollo-server';

const typeDefs = gql`
  type Query {
    hello: String
  }

  type Mutation {
    createUser(name: String, email: String, password: String, birthDate: String): User
  }

  type User {
    id: ID
    name: String
    email: String
    password: String
    birthDate: String
  }
`;

const resolvers = {
  Query: {
    hello: () => {
      return 'Hello world!';
    },
  },

  Mutation: {
    createUser: (_: number, { name, email, password, birthDate }) => {
      return { id: 1, name, email, birthDate };
    },
  },
};

const server = new ApolloServer({ typeDefs, resolvers });

server.listen(4000).then((response) => {
  console.log(`Server ready at ${response.url}`);
});
