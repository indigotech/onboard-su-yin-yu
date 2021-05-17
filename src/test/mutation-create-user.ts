import { expect } from 'chai';
import jwt from 'jsonwebtoken';
import request, { SuperTest, Test } from 'supertest';
import { getRepository, Repository } from 'typeorm';
import { User } from '../entity/User';
import { errorMessage } from '../error';
import { getDateFromISO } from './utils';

describe('GraphQL Mutation - Create User', () => {
  let requestServer: SuperTest<Test>;
  let userRepository: Repository<User>;
  let user: User;
  let login: User;
  let token: string;

  before((): void => {
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

      user = new User();
      user.name = 'User Name';
      user.email = 'name@email.com';
      user.password = 'abcd1234';
      user.birthDate = new Date(1990, 1, 1);
    },
  );

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
    const res = await requestServer
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
      birthDate: user.birthDate.toISOString(),
    });

    const dbUser = await userRepository.findOne({ id: resUser.id });
    expect(dbUser).to.deep.include({
      id: +resUser.id,
      name: user.name,
      email: user.email,
      birthDate: getDateFromISO(user.birthDate),
    });
  });

  it('should return an error about repeated email', async (): Promise<void> => {
    await userRepository.save(user);

    const duplicatedUser = new User();
    duplicatedUser.name = 'User Name';
    duplicatedUser.email = 'name@email.com';
    duplicatedUser.password = 'abcd1234';
    duplicatedUser.birthDate = new Date(1990, 1, 1);

    const res = await requestServer
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
    user.password = 'abcd';

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
    user.password = 'abcdefg';

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

  it('should return an error for mutation create user when token is missing', async (): Promise<void> => {
    const res = await requestServer
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

  it('should return an error for mutation create user  when token is invalid', async (): Promise<void> => {
    const invalidToken: string = jwt.sign({ id: login.id }, 'abc', { expiresIn: 3600 });

    const res = await requestServer
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
