import { db, schema } from '~~/server/db/index';

/** 返回所有房间/场景列表 */
export default defineEventHandler(async () => {
  return db.select().from(schema.rooms).orderBy(schema.rooms.name);
});
