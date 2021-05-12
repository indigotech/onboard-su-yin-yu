import { ApolloServer } from 'apollo-server';
import bcrypt from 'bcrypt';
import { expect } from 'chai';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import request, { SuperTest, Test } from 'supertest';
import { getRepository, Repository } from 'typeorm';
import { User } from '../entity/User';
import { errorMessage } from '../error';
import { startServer } from '../server-config';

dotenv.config({ path: '../test.env' });

let server: ApolloServer;
let requestServer: SuperTest<Test>;
let userRepository: Repository<User>;
let token: string;

before(
  async (): Promise<void> => {
    server = await startServer();
    requestServer = request(`http://localhost:${process.env.SERVER_PORT}`);
    userRepository = getRepository(User);
  },
);

beforeEach(
  async (): Promise<void> => {
    await userRepository.clear();

    const login: User = await saveNewUser(
      userRepository,
      'Authenticate Login',
      'login@email.com',
      'abcd1234',
      '01-01-1990',
    );

    const secret: string = process.env.JWT_SECRET ?? 'secret';
    token = jwt.sign({ id: login.id }, secret, { expiresIn: 3600 });
  },
);

describe('GraphQL Mutation', () => {
  const mutationCreateUser = `
    mutation CreateUser($data: UserInput) {
      createUser(data: $data) {
        id
        name
        email
        birthDate
      }
    }
  `;

  it('should be possible to create user', async (): Promise<void> => {
    const user: User = newUser('User Name', 'name@email.com', 'abcd1234', '01-01-1990');

    const res: request.Response = await requestServer
      .post('/graphql')
      .set('authorization', token)
      .send({
        query: mutationCreateUser,
        variables: { data: user },
      });

    const resUser: User = res.body.data.createUser;
    expect(resUser).to.have.property('id');
    expect(resUser).to.deep.include({
      name: user.name,
      email: user.email,
      birthDate: user.birthDate,
    });

    const dbUser = await userRepository.findOne({ id: resUser.id });
    expect(dbUser).to.deep.include({
      id: +resUser.id,
      name: user.name,
      email: user.email,
      birthDate: user.birthDate,
    });
  });

  it('should return an error about repeated email', async (): Promise<void> => {
    await saveNewUser(userRepository, 'User Name', 'name@email.com', 'abcd1234', '01-01-1990');

    const duplicatedUser: User = newUser('User Name', 'name@email.com', 'abcd1234', '01-01-1990');

    const res: request.Response = await requestServer
      .post('/graphql')
      .set('authorization', token)
      .send({
        query: mutationCreateUser,
        variables: { data: duplicatedUser },
      });

    expect(res.body.errors[0]).to.deep.include({
      message: errorMessage.email,
      code: 400,
    });
  });

  it('should return an error about short password', async (): Promise<void> => {
    const user: User = newUser('User Name', 'name@email.com', 'abcd', '01-01-1990');

    const res: request.Response = await requestServer
      .post('/graphql')
      .set('authorization', token)
      .send({
        query: mutationCreateUser,
        variables: { data: user },
      });

    expect(res.body.errors[0]).to.be.deep.equal({
      message: errorMessage.shortPassword,
      code: 400,
    });
  });

  it('should return an error about password pattern', async (): Promise<void> => {
    const user: User = newUser('User Name', 'name@email.com', 'abcdefg', '01-01-1990');

    const res: request.Response = await requestServer
      .post('/graphql')
      .set('authorization', token)
      .send({
        query: mutationCreateUser,
        variables: { data: user },
      });

    expect(res.body.errors[0]).to.be.deep.equal({
      message: errorMessage.passwordPattern,
      code: 400,
    });
  });

  it('should return an error for createUser when token is missing', async (): Promise<void> => {
    const user: User = newUser('User Name', 'name@email.com', 'abcd1234', '01-01-1990');

    const res: request.Response = await requestServer
      .post('/graphql')
      .send({
        query: mutationCreateUser,
        variables: { data: user },
      });

    expect(res.body.errors[0]).to.deep.include({
      message: errorMessage.default,
      code: 500,
    });
  });

  it('should return an error for mutation when token is invalid', async (): Promise<void> => {
    const user: User = newUser('User Name', 'name@email.com', 'abcd1234', '01-01-1990');

    const invalidToken: string = jwt.sign({ id: user.id }, 'abc', { expiresIn: 3600 });

    const res: request.Response = await requestServer
      .post('/graphql')
      .set('authorization', invalidToken)
      .send({
        query: mutationCreateUser,
        variables: { data: user },
      });

    expect(res.body.errors[0]).to.deep.include({
      message: errorMessage.default,
      code: 500,
    });
  });
});

describe('GraphQL Query', () => {
  const queryUser = `
    query ($data: ID!){
      user (id: $data){
        id
        name
        email
        birthDate
      }
    }
  `;

  it('should be possible to call hello query', async (): Promise<void> => {
    const res: request.Response = await requestServer
      .post('/graphql')
      .send({ query: '{ hello }' })
      .expect(200);
    expect(res.body.data.hello).to.equal('Hello world!');
  });

  it('should return the user fetched by id', async (): Promise<void> => {
    const user: User = await saveNewUser(userRepository, 'User Name', 'name@email.com', 'abcd1234', '01-01-1990');
    const userId: number = user.id;

    const res: request.Response = await requestServer
      .post('/graphql')
      .set('authorization', token)
      .send({
        query: queryUser,
        variables: { data: userId },
      });

    const findUser: User = res.body.data.user;
    expect(+findUser.id).to.equal(userId);
    expect(findUser).to.include.keys('name', 'email', 'birthDate');
  });

  it('should return an error about user not found', async (): Promise<void> => {
    const lastUserId: User = (await userRepository.findOne({ order: { id: 'DESC' } })) as any;
    const userId: number = lastUserId ? lastUserId.id + 1 : 1;

    const res: request.Response = await requestServer
      .post('/graphql')
      .set('authorization', token)
      .send({
        query: queryUser,
        variables: { data: userId },
      });

    expect(res.body.errors[0]).to.deep.equal({
      message: errorMessage.userNotFound,
      code: 404,
    });
  });

  it('should return an error for query user when token is missing', async (): Promise<void> => {
    const user: User = await saveNewUser(userRepository, 'User Name', 'name@email.com', 'abcd1234', '01-01-1990');
    const userId: number = user.id;

    const res: request.Response = await requestServer
      .post('/graphql')
      .send({
        query: queryUser,
        variables: { data: userId },
      });

    expect(res.body.errors[0]).to.deep.include({
      message: errorMessage.default,
      code: 500,
    });
  });

  it('should return an error for query user when token is invalid', async (): Promise<void> => {
    const user: User = await saveNewUser(userRepository, 'User Name', 'name@email.com', 'abcd1234', '01-01-1990');
    const userId: number = user.id;

    const invalidToken: string = jwt.sign({ id: user.id }, 'abc', { expiresIn: 3600 });

    const res: request.Response = await requestServer
      .post('/graphql')
      .set('authorization', invalidToken)
      .send({
        query: queryUser,
        variables: { data: userId },
      });

    expect(res.body.errors[0]).to.deep.include({
      message: errorMessage.default,
      code: 500,
    });
  });
});

after(
  async (): Promise<void> => {
    await server.stop();
  },
);

function newUser(name: string, email: string, password: string, birthDate: string): User {
  const user: User = new User();
  user.name = name;
  user.email = email;
  user.password = password;
  user.birthDate = birthDate;

  return user;
}

async function saveNewUser(
  repository: Repository<User>,
  name: string,
  email: string,
  password: string,
  birthDate: string,
): Promise<User> {

  const user: User = new User();
  user.name = name;
  user.email = email;
  user.password = await bcrypt.hash(password, 10);
  user.birthDate = birthDate;

  await repository.save(user);
  return user;
}
