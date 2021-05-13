import { expect } from 'chai';
import jwt from 'jsonwebtoken';
import request, { SuperTest, Test } from 'supertest';
import { getRepository, Repository } from 'typeorm';
import { User } from '../entity/User';
import { errorMessage } from '../error';
import { seedDatabase } from '../seed-database';
import { UserList } from '../user-input';
import { saveNewUser } from './utils';

describe('GraphQL Query - Users', () => {
  let requestServer: SuperTest<Test>;
  let userRepository: Repository<User>;
  let login: User;
  let token: string;

  before(() => {
    requestServer = request(`http://localhost:${process.env.SERVER_PORT}`);
    userRepository = getRepository(User);
  });

  beforeEach(
    async (): Promise<void> => {
      await seedDatabase(50, false);

      login = await saveNewUser(
        userRepository,
        'Authenticate Login',
        'login@email.com',
        'abcd1234',
        new Date(1990, 1, 1),
      );

      const secret: string = process.env.JWT_SECRET ?? 'secret';
      token = jwt.sign({ id: login.id }, secret, { expiresIn: 3600 });
    },
  );

  const queryUsers = `
    query ($data: Int){
      users (numUsers: $data) {
        list{
          id
          name
          email
          birthDate
        }
      }
    }
  `;

  it('should return a list with the number of users requested in the query', async (): Promise<void> => {
    const NUM_USERS = 5;

    const res = await requestServer
      .post('/graphql')
      .set('authorization', token)
      .send({
        query: queryUsers,
        variables: { data: NUM_USERS },
      });

    const userList: UserList = res.body.data.users;
    expect(userList.list).to.have.lengthOf(NUM_USERS);
    userList.list.forEach((user) => {
      expect(user).to.have.deep.keys('id', 'name', 'email', 'birthDate');
    });
  });

  it('should return a list with the default number of users if the query does not receive this parameter', async (): Promise<void> => {
    const DEFAULT_NUM_USERS = 10;

    const res = await requestServer
      .post('/graphql')
      .set('authorization', token)
      .send({
        query: queryUsers,
      });

    const userList: UserList = res.body.data.users;
    expect(userList.list).to.have.lengthOf(DEFAULT_NUM_USERS);
    userList.list.forEach((user) => {
      expect(user).to.have.deep.keys('id', 'name', 'email', 'birthDate');
    });
  });

  it('should return an error about empty list', async (): Promise<void> => {
    await userRepository.clear();

    const res = await requestServer
      .post('/graphql')
      .set('authorization', token)
      .send({
        query: queryUsers,
      });

    expect(res.body.errors[0]).to.deep.equal({
      message: errorMessage.userListEmpty,
      code: 404,
    });
  });

  it('should return an error for query users when token is missing', async (): Promise<void> => {
    const res = await requestServer
      .post('/graphql')
      .send({
        query: queryUsers,
      });

    expect(res.body.errors[0]).to.deep.include({
      message: errorMessage.default,
      code: 500,
    });
  });

  it('should return an error for query users when token is invalid', async (): Promise<void> => {
    const invalidToken: string = jwt.sign({ id: login.id }, 'abc', { expiresIn: 3600 });

    const res = await requestServer
      .post('/graphql')
      .set('authorization', invalidToken)
      .send({
        query: queryUsers,
      });

    expect(res.body.errors[0]).to.deep.include({
      message: errorMessage.default,
      code: 500,
    });
  });
});
