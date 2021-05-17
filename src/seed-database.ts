import faker from 'faker';
import { getRepository, Repository } from 'typeorm';
import { User } from './entity/User';

export async function seedDatabase(numberOfUsers: number): Promise<void> {
  const fakeUsers: User[] = [];
  let i = 0;

  do {
    const user = new User();
    user.name = faker.name.findName();
    user.email = faker.internet.email();
    user.password = faker.internet.password();
    user.birthDate = faker.date.between('1950-01-01', '2000-01-01');

    fakeUsers.push(user);
    i++;
  } while (i < numberOfUsers);

  const userRepository: Repository<User> = getRepository(User);
  await userRepository.clear();
  await userRepository.save(fakeUsers);
}
