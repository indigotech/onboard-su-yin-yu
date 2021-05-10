import { gql } from 'apollo-server';
import bcrypt from 'bcrypt';
import { expect } from 'chai';
import { getManager } from 'typeorm';
import { User } from './entity/User';
import { InputError } from './error';
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
        throw new InputError('A senha deve ter mais de 7 caracteres.');
      } else if (!checkPasswordPattern(user.password)) {
        throw new InputError('A senha deve conter letras e números.');
      } else {
        user.password = await bcrypt.hash(user.password, 10);
        try {
          await getManager().save(user);
        } catch (error) {
          if (expect(error.detail).to.match(/email.+already exists/)) {
            throw new InputError('Não foi possível cadastrar o e-mail. Tente outro e-mail.', error.detail);
          }
        }
      }

      return user;
    },
  },
};
