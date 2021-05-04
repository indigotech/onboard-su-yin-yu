import { ApolloServer, gql } from 'apollo-server';
import { createConnection } from 'typeorm';
import { User } from './entity/User';

const typeDefs = gql`
  type Query {
    hello: String
  }

  type Mutation {
    createUser(data: UserInput): User
  }

  input UserInput {
    name: String!
    email: String!
    password: String!
    birthDate: String
  }

  type User {
    id: ID
    name: String
    email: String
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
    createUser: async (_, userData) => {
      try {
        const user = User.create({
          name: userData.data.name,
          email: userData.data.email,
          password: userData.data.password,
          birthDate: userData.data.birthDate,
        });
        return user.save();
      } catch (error) {
        return error;
      }
    },
  },
};

const startServer = async () => {
  const server = new ApolloServer({ typeDefs, resolvers });

  await createConnection();

  server.listen(4000).then((response) => {
    console.log(`Server ready at ${response.url}`);
  });
};

startServer();
