import faker from 'faker';
import { getRepository, Repository } from 'typeorm';
import { Address } from './entity/Address';
import { User } from './entity/User';

export async function seedDatabase(numUsers: number): Promise<User[]> {
  const fakeUsers: User[] = [];
  let i = 0;

  do {
    const user = new User();
    user.name = faker.name.findName();
    user.email = faker.internet.email();
    user.password = faker.internet.password();
    user.birthDate = faker.date.between('1950-01-01', '2000-01-01');

    user.address = [];
    user.address.push(createAddress());

    fakeUsers.push(user);
    i++;
  } while (i < numUsers);

  const userRepository: Repository<User> = getRepository(User);
  await userRepository.save(fakeUsers);

  return fakeUsers;
}

export function createAddress(): Address {
  const address = new Address();
  address.cep = faker.datatype.number(99999999);
  address.street = faker.address.streetName();
  address.streetNumber = faker.datatype.number(2000);
  address.neighborhood = faker.address.cityName();
  address.city = faker.address.cityName();
  address.state = faker.address.stateAbbr();

  return address;
}
