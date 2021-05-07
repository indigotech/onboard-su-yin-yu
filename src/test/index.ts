import { expect } from 'chai';
import request, { SuperTest, Test } from 'supertest';
import { getRepository, Repository } from 'typeorm';
import { User } from '../entity/User';
import { startServer } from '../server-config';

describe('Apollo Server API', () => {
  let requestServer: SuperTest<Test>;
  let userRepository: Repository<User>;

  before(async () => {
    await startServer();
    requestServer = request(`http://localhost:4000`);
    userRepository = getRepository(User);
  });

  beforeEach(async () => {
    userRepository.clear();
  });

  it('should be possible to call hello query', async (): Promise<void> => {
    const res: request.Response = await requestServer
      .post('/graphql')
      .send({ query: '{ hello }' })
      .expect(200);
    expect(res.body.data.hello).to.equal('Hello world!');
  });

  it('should be possible to create user', async (): Promise<void> => {
    await requestServer
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
  });
});
