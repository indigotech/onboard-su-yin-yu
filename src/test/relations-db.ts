import { expect } from 'chai';
import faker from 'faker';
import { getRepository, Repository } from 'typeorm';
import { Address } from '../entity/Address';
import { User } from '../entity/User';
import { getDateFromISO } from './utils';

describe('Relations on DB', () => {
  let userRepository: Repository<User>;

  before((): void => {
    userRepository = getRepository(User);
  });

  beforeEach(
    async (): Promise<void> => {
      await userRepository.delete({});
    },
  );

  it('should be possible to creat an user with 2 addresses', async (): Promise<void> => {
    const user = new User();
    user.name = faker.name.findName();
    user.email = faker.internet.email();
    user.password = faker.internet.password();
    user.birthDate = faker.date.between('1950-01-01', '2000-01-01');
    user.address = [];

    const address1 = new Address();
    address1.cep = 12345678;
    address1.street = 'Avenida Paulista';
    address1.streetNumber = 1234;
    address1.neighborhood = 'Bela Vista';
    address1.city = 'São Paulo';
    address1.state = 'São Paulo';

    const address2 = new Address();
    address2.cep = 23456789;
    address2.street = 'Avenida da Liberdade';
    address2.streetNumber = 500;
    address2.neighborhood = 'Liberdade';
    address2.city = 'São Paulo';
    address2.state = 'São Paulo';

    user.address = [address1, address2];

    const createdUser = await userRepository.manager.save(user);

    const dbUser = await userRepository.findOne({ relations: ['address'], where: { id: createdUser.id } });
    expect(dbUser).to.deep.include({
      name: user.name,
      email: user.email,
      birthDate: getDateFromISO(user.birthDate),
      address: [address1, address2],
    });
  });
});
