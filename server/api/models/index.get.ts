import { and, eq } from 'drizzle-orm';
import { db, schema } from '~~/server/db/index';

/**
 * GET /api/models
 * Returns all models (optionally filtered by ?enabled=1 or ?providerId=X).
 * Only returns models belonging to the current user's providers.
 */
export default defineEventHandler(async (event) => {
  const userId = event.context.userId as number;
  const query = getQuery(event);

  let q = db
    .select({
      id: schema.models.id,
      providerId: schema.models.providerId,
      modelId: schema.models.modelId,
      name: schema.models.name,
      enabled: schema.models.enabled,
      providerName: schema.providers.name,
      createdAt: schema.models.createdAt,
      updatedAt: schema.models.updatedAt,
    })
    .from(schema.models)
    .innerJoin(
      schema.providers,
      eq(schema.models.providerId, schema.providers.id),
    )
    .$dynamic();

  // 始终按用户过滤（通过 provider 的 userId）
  const conditions = [eq(schema.providers.userId, userId)];

  if (query.enabled === '1') {
    conditions.push(eq(schema.models.enabled, true));
  }

  if (query.providerId) {
    conditions.push(eq(schema.models.providerId, Number(query.providerId)));
  }

  q = q.where(and(...conditions));

  return q.orderBy(schema.models.providerId, schema.models.modelId);
});
