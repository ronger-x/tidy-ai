import { eq } from 'drizzle-orm';
import { db, schema } from '~~/server/db/index';

/**
 * GET /api/models
 * Returns all models (optionally filtered by ?enabled=1 or ?providerId=X).
 * Used by the chat page to populate the model selector.
 */
export default defineEventHandler(async (event) => {
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
    .leftJoin(
      schema.providers,
      eq(schema.models.providerId, schema.providers.id),
    )
    .$dynamic();

  const conditions = [];

  if (query.enabled === '1') {
    conditions.push(eq(schema.models.enabled, true));
  }

  if (query.providerId) {
    conditions.push(eq(schema.models.providerId, Number(query.providerId)));
  }

  if (conditions.length > 0) {
    const { and } = await import('drizzle-orm');
    q = q.where(and(...conditions));
  }

  return q.orderBy(schema.models.providerId, schema.models.modelId);
});
