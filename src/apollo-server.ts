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
    name: String
    email: String
    password: String
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
      const { name, email, password, birthDate } = userData;

      try {
        const user = User.create({
          name,
          email,
          password,
          birthDate,
        });
        await user.save();
        return user;
      } catch (error) {
        console.log(error);
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
