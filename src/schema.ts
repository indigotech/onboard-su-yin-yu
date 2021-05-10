import { gql } from 'apollo-server';
import bcrypt from 'bcrypt';
import { getManager, getRepository } from 'typeorm';
import { User } from './entity/User';
import { errorMessage, InputError, InternalError } from './error';
import { checkPasswordLength, checkPasswordPattern, CreateUserMutation } from './user-input';

export const typeDefs = gql`
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

export const resolvers = {
  Query: {
    hello: (): string => {
      return 'Hello world!';
    },
  },

  Mutation: {
    createUser: async (_, userData: CreateUserMutation): Promise<User> => {
      const user = new User();

      user.name = userData.data.name;
      user.email = userData.data.email;
      user.password = userData.data.password;
      user.birthDate = userData.data.birthDate;

      if (!checkPasswordLength(user.password)) {
        throw new InputError(errorMessage.shortPassword);
      }

      if (!checkPasswordPattern(user.password)) {
        throw new InputError(errorMessage.passwordPattern);
      }

      user.password = await bcrypt.hash(user.password, 10);

      try {
        await getManager().save(user);
      } catch (error) {
        const userRepository = await getRepository(User);
        const findUser = await userRepository.find({ email: user.email });

        if (findUser.length > 0) {
          throw new InputError(errorMessage.email, error.detail);
        } else {
          throw new InternalError();
        }
      }

      return user;
    },
  },
};
