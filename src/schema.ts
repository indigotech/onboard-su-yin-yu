import { gql } from 'apollo-server';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { getManager, getRepository } from 'typeorm';
import { User } from './entity/User';
import { AuthError, errorMessage, InputError, InternalError } from './error';
import { AuthPayload, checkPasswordLength, checkPasswordPattern, CreateUserMutation, LoginInput } from './user-input';

export const typeDefs = gql`
  type Query {
    hello: String
  }

  type Mutation {
    createUser(data: UserInput): User
    login(data: LoginInput): AuthPayload
  }

  input UserInput {
    name: String!
    email: String!
    password: String!
    birthDate: String
  }

  input LoginInput {
    email: String!
    password: String!
    rememberMe: Boolean
  }

  type User {
    id: ID!
    name: String!
    email: String!
    birthDate: String
  }

  type AuthPayload {
    db_user: User!
    token: String!
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

    login: async (_, login: { data: LoginInput }): Promise<AuthPayload> => {
      const userRepository = await getRepository(User);

      const db_user = await userRepository.findOne({ email: login.data.email });
      if (!db_user) {
        throw new AuthError();
      }

      const valid = await bcrypt.compare(login.data.password, db_user.password);
      if (!valid) {
        throw new AuthError();
      }

      let token: string;
      const secret = process.env.JWT_SECRET ?? 'secret';

      if (login.data.rememberMe) {
        token = jwt.sign({ email: db_user.email }, secret, { expiresIn: 7 * 24 * 3600 });
      } else {
        token = jwt.sign({ email: db_user.email }, secret, { expiresIn: 3600 });
      }

      return { db_user, token };
    },
  },
};
