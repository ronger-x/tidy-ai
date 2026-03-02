import { migrate } from 'drizzle-orm/libsql/migrator';
import { db } from '~~/server/db/index';
import { resolve } from 'node:path';

export default defineNitroPlugin(async () => {
  try {
    await migrate(db, {
      migrationsFolder: resolve('./server/db/migrations'),
    });
    console.log('[db] Migrations applied');
  } catch (error) {
    console.error('[db] Migration failed:', error);
    throw error;
  }
});
