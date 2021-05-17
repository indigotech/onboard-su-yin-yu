import { expect, use } from 'chai';
import chaiExclude from 'chai-exclude';
import faker from 'faker';
import { getRepository, Repository } from 'typeorm';
import { Address } from '../entity/Address';
import { User } from '../entity/User';
import { createAddress, seedDatabase } from '../seed-database';
import { getDateFromISO } from './utils';

use(chaiExclude);

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

  it('should be possible to creat a user with 2 addresses', async (): Promise<void> => {
    const user = new User();
    user.name = faker.name.findName();
    user.email = faker.internet.email();
    user.password = faker.internet.password();
    user.birthDate = faker.date.between('1950-01-01', '2000-01-01');

    user.address = [];
    user.address.push(createAddress());
    user.address.push(createAddress());

    const createdUser = await userRepository.manager.save(user);

    const dbUser = await userRepository.findOne({ relations: ['address'], where: { id: createdUser.id } });
    expect(dbUser).to.deep.include({
      name: user.name,
      email: user.email,
      birthDate: getDateFromISO(user.birthDate),
      address: user.address,
    });
  });

  it('should be possible to fetch a user and add an address to him/her', async (): Promise<void> => {
    const fakerUsers: User[] = await seedDatabase(1);
    const user: User = fakerUsers[0];
    await userRepository.save(user);

    const dbUser = await userRepository.findOne({ relations: ['address'], where: { id: user.id } });
    const newAddress: Address = createAddress();
    user.address.push(newAddress);
    if (dbUser) {
      dbUser.address.push(newAddress);
      await userRepository.save(dbUser);
    }

    const dbUserUpdated = await userRepository.findOne({ relations: ['address'], where: { id: user.id } });
    expect(dbUserUpdated).excludingEvery('id').to.deep.equal({
      name: user.name,
      email: user.email,
      password: user.password,
      birthDate: getDateFromISO(user.birthDate),
      address: user.address,
    });
  });
});
