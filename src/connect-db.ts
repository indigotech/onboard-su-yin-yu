import dotenv from 'dotenv';
import { createConnection } from 'typeorm';
import { Address } from './entity/Address';
import { User } from './entity/User';

export async function connectDb(): Promise<void> {
  const path = process.env.TEST === 'OK' ? './test.env' : './.env';
  dotenv.config({ path });

  await createConnection({
    type: 'postgres',
    host: process.env.PS_HOST,
    port: +(process.env.PS_PORT ?? 5432),
    username: process.env.PS_USER,
    password: process.env.PS_PASSWORD,
    database: process.env.PS_DATABASE,
    synchronize: true,
    logging: false,
    entities: [User, Address],
  });
}
