import { ApolloServer } from 'apollo-server';
import { expect } from 'chai';
import dotenv from 'dotenv';
import request, { SuperTest, Test } from 'supertest';
import { getRepository, Repository } from 'typeorm';
import { User } from '../entity/User';
import { startServer } from '../server-config';

dotenv.config({ path: '../test.env' });

describe('Apollo Server API', () => {
  let server: ApolloServer;
  let requestServer: SuperTest<Test>;
  let userRepository: Repository<User>;

  before(async () => {
    server = await startServer();
    requestServer = request(`http://localhost:4000`);
    userRepository = getRepository(User);
    await userRepository.clear();
  });

  it('should be possible to call hello query', async (): Promise<void> => {
    const res: request.Response = await requestServer
      .post('/graphql')
      .send({ query: '{ hello }' })
      .expect(200);
    expect(res.body.data.hello).to.equal('Hello world!');
  });

  it('should be possible to create user', async (): Promise<void> => {
    const res: request.Response = await requestServer
      .post('/graphql')
      .send({
        query: `mutation CreateUser($data: UserInput) {
          createUser(data: $data) {
            id
            name
            email
            birthDate
          }
        }`,
        variables: {
          data: {
            name: 'User Name',
            email: 'name@email.com',
            password: 'abcd1234',
            birthDate: '01-01-1990',
          },
        },
      })
      .expect(200);

    const user: User = res.body.data.createUser;
    expect(user).to.be.deep.equal({
      id: user.id,
      name: 'User Name',
      email: 'name@email.com',
      birthDate: '01-01-1990',
    });

    const findUser = await userRepository.find({ id: user.id });
    expect(findUser[0]).to.deep.include({
      id: +user.id,
      name: user.name,
      email: user.email,
      birthDate: user.birthDate
    })
  });

  after(async () => {
    await server.stop();
  });
});
