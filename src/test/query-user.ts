import { expect, use } from 'chai';
import chaiExclude from 'chai-exclude';
import jwt from 'jsonwebtoken';
import request, { SuperTest, Test } from 'supertest';
import { getRepository, Repository } from 'typeorm';
import { User } from '../entity/User';
import { errorMessage } from '../error';
import { seedDatabase } from '../seed-database';
import { getDateFromISO } from './utils';

use(chaiExclude);

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
      await userRepository.delete({});

      login = new User();
      login.name = 'Authenticate Login';
      login.email = 'login@email.com';
      login.password = 'abcd1234';
      login.birthDate = new Date(1990, 1, 1);
      await userRepository.save(login);

      const secret: string = process.env.JWT_SECRET ?? 'secret';
      token = jwt.sign({ id: login.id }, secret, { expiresIn: 3600 });

      const fakerUsers: User[] = await seedDatabase(1);
      user = fakerUsers[0];
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
        address {
          id
          cep
          street
          streetNumber
          complement
          neighborhood
          city
          state
        }
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
    expect(resUser).excludingEvery('id').to.deep.equal({
      name: user.name,
      email: user.email,
      birthDate: getDateFromISO(user.birthDate),
      address: user.address,
    });
    expect(resUser.id).to.deep.equal(String(userId));
  });

  it('should return an error about user not found', async (): Promise<void> => {
    const lastUserId: User = await userRepository.findOne({ relations: ['address'], order: { id: 'DESC' } }) as any;
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
