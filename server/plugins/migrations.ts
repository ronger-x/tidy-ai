import { migrate } from 'drizzle-orm/libsql/migrator';
import { db } from '~~/server/db/index';
import { resolve } from 'node:path';

export default defineNitroPlugin(async () => {
  await migrate(db, {
    migrationsFolder: resolve('./server/db/migrations'),
  });
  console.log('[db] Migrations applied');
});
