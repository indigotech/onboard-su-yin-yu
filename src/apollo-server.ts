import { ApolloServer, gql } from 'apollo-server';

const typeDefs = gql`
  type Query {
    hello: String
  }

  type Mutation {
    createUser(data: UserInput): User
  }

  input UserInput {
    name: String
    email: String
    password: String
    birthDate: String
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
    createUser: (_, userData) => {
      return {
        id: 1,
        name: userData.data.name,
        email: userData.data.email,
        birthDate: userData.data.birthDate,
      };
    },
  },
};

const server = new ApolloServer({ typeDefs, resolvers });

server.listen(4000).then((response) => {
  console.log(`Server ready at ${response.url}`);
});
