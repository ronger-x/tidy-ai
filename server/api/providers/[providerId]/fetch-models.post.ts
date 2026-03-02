import { and, eq } from 'drizzle-orm';
import OpenAI from 'openai';
import { db, schema } from '~~/server/db/index';

/**
 * POST /api/providers/:providerId/fetch-models
 * Calls the provider's API to list available models.
 * Upserts results into the models table (preserves existing enabled state).
 */
export default defineEventHandler(async (event) => {
  const userId = event.context.userId as number;
  const id = Number(getRouterParam(event, 'providerId'));

  const [provider] = await db
    .select()
    .from(schema.providers)
    .where(
      and(eq(schema.providers.id, id), eq(schema.providers.userId, userId)),
    )
    .limit(1);

  if (!provider)
    throw createError({ statusCode: 404, message: 'Provider not found' });

  const client = new OpenAI({
    apiKey: provider.apiKey || 'none',
    baseURL: provider.baseUrl,
  });

  let remoteModels: { id: string; created?: number }[];
  try {
    const list = await client.models.list();
    remoteModels = list.data;
  } catch (err) {
    throw createError({
      statusCode: 502,
      message: `Failed to fetch models: ${(err as Error).message}`,
    });
  }

  // Fetch existing models for this provider
  const existing = await db
    .select()
    .from(schema.models)
    .where(eq(schema.models.providerId, id));

  const existingMap = new Map(existing.map((m) => [m.modelId, m]));
  const now = new Date();

  // Upsert: insert new, skip existing (preserve enabled state)
  const toInsert = remoteModels
    .filter((m) => !existingMap.has(m.id))
    .map((m) => ({
      providerId: id,
      modelId: m.id,
      name: m.id,
      enabled: false,
      createdAt: now,
      updatedAt: now,
    }));

  if (toInsert.length > 0) {
    await db.insert(schema.models).values(toInsert);
  }

  // Return all models for this provider after upsert
  const all = await db
    .select()
    .from(schema.models)
    .where(eq(schema.models.providerId, id))
    .orderBy(schema.models.modelId);

  return all;
});
