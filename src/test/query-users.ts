import { expect } from 'chai';
import jwt from 'jsonwebtoken';
import request, { SuperTest, Test } from 'supertest';
import { getRepository, Repository } from 'typeorm';
import { User } from '../entity/User';
import { errorMessage } from '../error';
import { seedDatabase } from '../seed-database';
import { UserList } from '../user-input';

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
      await seedDatabase(50);

      login = new User();
      login.name = 'Authenticate Login';
      login.email = 'login@email.com';
      login.password = 'abcd1234';
      login.birthDate = new Date(1990, 1, 1);
      await userRepository.save(login);

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

    const resUsers: UserList = res.body.data.users.list;
    const dbUsers = await userRepository.find({ order: { name: 'ASC' }, take: NUM_USERS });
    for (let i = 0; i < 5; i++) {
      expect(resUsers[i]).to.be.deep.equal({
        id: String(dbUsers[i].id),
        name: dbUsers[i].name,
        email: dbUsers[i].email,
        birthDate: dbUsers[i].birthDate,
      });
    }
  });

  it('should return the default number of users if the query does not receive this parameter', async (): Promise<void> => {
    const DEFAULT_NUM_USERS = 10;

    const res = await requestServer
      .post('/graphql')
      .set('authorization', token)
      .send({
        query: queryUsers,
      });

    const resUsers: UserList = res.body.data.users.list;
    const dbUsers = await userRepository.find({ order: { name: 'ASC' }, take: DEFAULT_NUM_USERS });
    for (let i = 0; i < DEFAULT_NUM_USERS; i++) {
      expect(resUsers[i]).to.be.deep.equal({
        id: String(dbUsers[i].id),
        name: dbUsers[i].name,
        email: dbUsers[i].email,
        birthDate: dbUsers[i].birthDate,
      });
    }
  });

  it('should return an empty user array when database is empty', async (): Promise<void> => {
    await userRepository.clear();

    const res = await requestServer
      .post('/graphql')
      .set('authorization', token)
      .send({
        query: queryUsers,
      });

    expect(res.body.data.users.list).to.deep.equal([]);
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
