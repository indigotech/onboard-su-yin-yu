import { expect } from 'chai';
import jwt from 'jsonwebtoken';
import request, { SuperTest, Test } from 'supertest';
import { getRepository, Repository } from 'typeorm';
import { User } from '../entity/User';
import { errorMessage } from '../error';
import { getDateFromISO, saveNewUser } from './utils';

describe('GraphQL Query - User', () => {
  let requestServer: SuperTest<Test>;
  let userRepository: Repository<User>;
  let login: User;
  let token: string;
  let user: User;
  let userId: number;

  before(() => {
    requestServer = request(`http://localhost:${process.env.SERVER_PORT}`);
    userRepository = getRepository(User);
  });

  beforeEach(
    async (): Promise<void> => {
      await userRepository.clear();

      login = await saveNewUser(
        userRepository,
        'Authenticate Login',
        'login@email.com',
        'abcd1234',
        new Date(1990, 1, 1),
      );

      const secret: string = process.env.JWT_SECRET ?? 'secret';
      token = jwt.sign({ id: login.id }, secret, { expiresIn: 3600 });

      user = await saveNewUser(userRepository, 'User Name', 'name@email.com', 'abcd1234', new Date(1990, 1, 1));
      userId = user.id;
    },
  );

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

  it('should return the user fetched by id', async (): Promise<void> => {
    const res = await requestServer
      .post('/graphql')
      .set('authorization', token)
      .send({
        query: queryUser,
        variables: { data: userId },
      });

    const resUser: User = res.body.data.user;
    expect(resUser).to.be.deep.eq({
      id: String(userId),
      name: user.name,
      email: user.email,
      birthDate: getDateFromISO(user.birthDate),
    });
  });

  it('should return an error about user not found', async (): Promise<void> => {
    const lastUserId: User = (await userRepository.findOne({ order: { id: 'DESC' } })) as any;
    userId = lastUserId ? lastUserId.id + 1 : 1;

    const res = await requestServer
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
    const res = await requestServer
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
    const invalidToken: string = jwt.sign({ id: login.id }, 'abc', { expiresIn: 3600 });

    const res = await requestServer
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