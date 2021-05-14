import { gql } from 'apollo-server';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { getManager, getRepository } from 'typeorm';
import { User } from './entity/User';
import { AuthError, ConflictError, errorMessage, InputError, NotFoundError } from './error';
import {
  AuthPayload,
  checkPasswordLength,
  checkPasswordPattern,
  Context,
  CreateUserMutation,
  LoginInput,
  UserList,
} from './user-input';

export const typeDefs = gql`
  type Query {
    hello: String
    user(id: ID!): User
    users(numUsers: Int): UserList
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

  type UserList {
    list: [User]
  }

  type AuthPayload {
    user: User!
    token: String!
  }
`;

export const resolvers = {
  Query: {
    hello: (): string => {
      return 'Hello world!';
    },

    user: async (_, userId: { id: number }, context: Context): Promise<User> => {
      const secret = process.env.JWT_SECRET ?? 'secret';
      jwt.verify(context.token, secret);

      const userRepository = getRepository(User);
      const findUser = await userRepository.findOne({ id: userId.id });

      if (!findUser) {
        throw new NotFoundError(errorMessage.userNotFound);
      }

      return findUser;
    },

    users: async (_, list: { numUsers: number }, context: Context): Promise<UserList> => {
      const secret = process.env.JWT_SECRET ?? 'secret';
      jwt.verify(context.token, secret);

      const DEFAULT_NUMBER_OF_USERS = 10;
      const takeUsers = list.numUsers ?? DEFAULT_NUMBER_OF_USERS;

      const userRepository = getRepository(User);
      const usersList = await userRepository.find({ order: { name: 'ASC' }, take: takeUsers });

      return { list: usersList };
    },
  },

  Mutation: {
    createUser: async (_, userData: CreateUserMutation, context: Context): Promise<User> => {
      const secret = process.env.JWT_SECRET ?? 'secret';
      jwt.verify(context.token, secret);

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

      const userRepository = getRepository(User);
      const findUser = await userRepository.findOne({ email: user.email });
      if (findUser) {
        throw new InputError(errorMessage.email);
      }

      return getManager().save(user);
    },

    login: async (_, login: { data: LoginInput }): Promise<AuthPayload> => {
      const userRepository = getRepository(User);

      const dbUser = await userRepository.findOne({ email: login.data.email });
      if (!dbUser) {
        throw new ConflictError();
      }

      const isPasswordValid = await bcrypt.compare(login.data.password, dbUser.password);
      if (!isPasswordValid) {
        throw new AuthError();
      }

      const secret = process.env.JWT_SECRET ?? 'secret';
      const token = jwt.sign(
        { id: dbUser.id },
        secret,
        { expiresIn: login.data.rememberMe ? 7 * 24 * 3600 : 3600 }
      );

      return { user: dbUser, token };
    },
  },
};
