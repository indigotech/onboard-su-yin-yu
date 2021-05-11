import { ApolloServer } from 'apollo-server';
import { expect } from 'chai';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import request, { SuperTest, Test } from 'supertest';
import { getRepository, Repository } from 'typeorm';
import { User } from '../entity/User';
import { errorMessage } from '../error';
import { startServer } from '../server-config';

dotenv.config({ path: '../test.env' });

describe('Apollo Server API', () => {
  let server: ApolloServer;
  let requestServer: SuperTest<Test>;
  let userRepository: Repository<User>;
  let token: string;

  before(async () => {
    server = await startServer();
    requestServer = request(`http://localhost:4000`);
    userRepository = getRepository(User);
    await userRepository.clear();

    const user = new User();
    user.name = 'User Name';
    user.email = 'login@email.com';
    user.password = 'abcd1234';
    user.birthDate = '01-01-1990';
    await userRepository.save(user);

    const secret = process.env.JWT_SECRET ?? 'secret';
    token = jwt.sign({ email: user.email }, secret, { expiresIn: 3600 });
  });

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

  it('should be possible to call hello query', async (): Promise<void> => {
    const res: request.Response = await requestServer
      .post('/graphql')
      .send({ query: '{ hello }' })
      .expect(200);
    expect(res.body.data.hello).to.equal('Hello world!');
  });

  it('should be possible to create user', async (): Promise<void> => {
    const user = new User();
    user.name = 'User Name';
    user.email = 'name@email.com';
    user.password = 'abcd1234';
    user.birthDate = '01-01-1990';

    const res: request.Response = await requestServer
      .post('/graphql')
      .set('authorization', token)
      .send({
        query: mutationCreateUser,
        variables: { data: user },
      });

    const createdUser = res.body.data.createUser;
    expect(createdUser).to.have.property('id');
    expect(createdUser).to.deep.include({
      name: user.name,
      email: user.email,
      birthDate: user.birthDate,
    });

    const findUser = await userRepository.find({ id: createdUser.id });
    expect(findUser[0]).to.deep.include({
      id: +createdUser.id,
      name: user.name,
      email: user.email,
      birthDate: user.birthDate
    })
  });

  it('should return an error about repeated email', async (): Promise<void> => {
    const user = new User();
    user.name = 'User Name 2';
    user.email = 'name@email.com';
    user.password = 'abcd1234';
    user.birthDate = '01-01-1990';

    const res = await requestServer
      .post('/graphql')
      .set('authorization', token)
      .send({
        query: mutationCreateUser,
        variables: { data: user },
      });

    expect(res.body.errors[0]).to.deep.include({
      message: errorMessage.email,
      code: 400,
    });
  });

  it('should return an error about short password', async (): Promise<void> => {
    const user = new User();
    user.name = 'User Name 3';
    user.email = 'name3@email.com';
    user.password = 'abcd';
    user.birthDate = '01-01-1990';

    const res = await requestServer
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
    const user = new User();
    user.name = 'User Name 4';
    user.email = 'name4@email.com';
    user.password = 'abcdefg';
    user.birthDate = '01-01-1990';

    const res = await requestServer
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

  it('should return an error about missing tokenn', async (): Promise<void> => {
    const user = new User();
    user.name = 'User Name 5';
    user.email = 'name5@email.com';
    user.password = 'abcdefg';
    user.birthDate = '01-01-1990';

    const res = await requestServer
      .post('/graphql')
      .send({
        query: mutationCreateUser,
        variables: { data: user },
      });

    expect(res.body.errors[0]).to.be.deep.equal({
      message: errorMessage.invalidLogin,
      code: 401,
    });
  });

  it('should return an error about invalid tokenn', async (): Promise<void> => {
    const user = new User();
    user.name = 'User Name 6';
    user.email = 'name6@email.com';
    user.password = 'abcdefg';
    user.birthDate = '01-01-1990';

    token = jwt.sign({ email: user.email }, 'abc', { expiresIn: 3600 });

    const res = await requestServer
      .post('/graphql')
      .set('authorization', token)
      .send({
        query: mutationCreateUser,
        variables: { data: user },
      });

    expect(res.body.errors[0]).to.be.deep.equal({
      message: errorMessage.invalidLogin,
      code: 401,
    });
  });

  after(async () => {
    await server.stop();
  });
});
