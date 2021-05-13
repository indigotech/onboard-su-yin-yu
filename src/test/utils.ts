import bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { User } from '../entity/User';

export function newUser(name: string, email: string, password: string, birthDate: Date): User {
  const user: User = new User();
  user.name = name;
  user.email = email;
  user.password = password;
  user.birthDate = birthDate;

  return user;
}

export async function saveNewUser(
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

export function getDateFromISO(date: Date): string {
  return date.toISOString().split('T')[0];
}
