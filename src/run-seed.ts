import { connectDb } from './connect-db';
import { seedDatabase } from './seed-database';

async function seed(): Promise<void> {
  await connectDb();
  seedDatabase(50);
}

seed();
