import bcrypt from 'bcrypt';
import { expect } from 'chai';
import jwt from 'jsonwebtoken';
import request, { SuperTest, Test } from 'supertest';
import { getRepository, Repository } from 'typeorm';
import { User } from '../entity/User';
import { errorMessage } from '../error';

describe('GraphQL Query', () => {
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

  it('should be possible to call hello query', async (): Promise<void> => {
    const res: request.Response = await requestServer
      .post('/graphql').
      send({ query: '{ hello }' })
      .expect(200);
    expect(res.body.data.hello).to.equal('Hello world!');
  });

  it('should return the user fetched by id', async (): Promise<void> => {
    const res: request.Response = await requestServer
      .post('/graphql')
      .set('authorization', token)
      .send({
        query: queryUser,
        variables: { data: userId },
      });

    const findUser: User = res.body.data.user;
    expect(findUser).to.be.deep.eq({
      id: String(userId),
      name: user.name,
      email: user.email,
      birthDate: getDateFromISO(user.birthDate),
    });
  });

  it('should return an error about user not found', async (): Promise<void> => {
    const lastUserId: User = (await userRepository.findOne({ order: { id: 'DESC' } })) as any;
    userId = lastUserId ? lastUserId.id + 1 : 1;

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
    const invalidToken: string = jwt.sign({ id: login.id }, 'abc', { expiresIn: 3600 });

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

async function saveNewUser(
  repository: Repository<User>,
  name: string,
  email: string,
  password: string,
  birthDate: Date,
): Promise<User> {

  const user: User = new User();
  user.name = name;
  user.email = email;
  user.password = await bcrypt.hash(password, 10);
  user.birthDate = birthDate;

  await repository.save(user);
  return user;
}

function getDateFromISO(date: Date): string {
  return date.toISOString().split('T')[0];
}