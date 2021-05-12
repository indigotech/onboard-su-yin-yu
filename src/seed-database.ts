import dotenv from 'dotenv';
import faker from 'faker';
import { createConnection, getRepository, Repository } from 'typeorm';
import { User } from './entity/User';

async function seedDatabase(numberOfUsers) {
  dotenv.config({ path: './.env' });

  await createConnection({
    type: 'postgres',
    host: process.env.PS_HOST,
    port: +(process.env.PS_PORT ?? 5432),
    username: process.env.PS_USER,
    password: process.env.PS_PASSWORD,
    database: process.env.PS_DATABASE,
    synchronize: true,
    logging: false,
    entities: [User],
  });

  const userRepository: Repository<User> = getRepository(User);
  await userRepository.clear();

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

  userRepository.save(fakeUsers);
}

seedDatabase(100);
