import { ApolloServer, gql } from 'apollo-server';
import { createConnection, getManager } from 'typeorm';
import { User } from './entity/User';
import { validate } from 'class-validator';

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
      const user = new User();

      user.name = userData.data.name;
      user.email = userData.data.email;
      user.password = userData.data.password;
      user.birthDate = userData.data.birthDate;

      const errors = await validate(user);

      if (errors.length > 0) {
        throw new Error("Invalid input");
      } else if (!checkPassword(user.password)) {
        throw new Error("The password should have at least 1 letter and 1 digit");
      } else {
        return getManager().save(user);
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

const checkPassword = (password: string): boolean => {
  const containsLetter = new RegExp(/[a-zA-Z]+/);
  const containsDigit = new RegExp(/[0-9]+/);

  return containsLetter.test(password) && containsDigit.test(password);
};
