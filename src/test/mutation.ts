import bcrypt from 'bcrypt';
import { expect } from 'chai';
import jwt from 'jsonwebtoken';
import request, { SuperTest, Test } from 'supertest';
import { getRepository, Repository } from 'typeorm';
import { User } from '../entity/User';
import { errorMessage } from '../error';

describe('GraphQL Mutation', () => {
  let requestServer: SuperTest<Test>;
  let userRepository: Repository<User>;
  let login: User;
  let token: string;

  before((): void => {
    requestServer = request(`http://localhost:${process.env.SERVER_PORT}`);
    userRepository = getRepository(User);
  },
  );

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
    const user: User = newUser('User Name', 'name@email.com', 'abcd1234', new Date(1990, 1, 1));

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
    await saveNewUser(userRepository, 'User Name', 'name@email.com', 'abcd1234', new Date(1990, 1, 1));
    const duplicatedUser: User = newUser('User Name', 'name@email.com', 'abcd1234', new Date(1990, 1, 1));

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
    const user: User = newUser('User Name', 'name@email.com', 'abcd', new Date(1990, 1, 1));

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
    const user: User = newUser('User Name', 'name@email.com', 'abcdefg', new Date(1990, 1, 1));

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
    const user: User = newUser('User Name', 'name@email.com', 'abcd1234', new Date(1990, 1, 1));

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
    const user: User = newUser('User Name', 'name@email.com', 'abcd1234', new Date(1990, 1, 1));

    const invalidToken: string = jwt.sign({ id: login.id }, 'abc', { expiresIn: 3600 });

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

function newUser(name: string, email: string, password: string, birthDate: Date): User {
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