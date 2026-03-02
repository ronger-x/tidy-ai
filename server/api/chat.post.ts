import { streamText } from 'ai';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db, schema } from '~~/server/db/index';

const messageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().min(1),
  /** Base64 data URLs for image attachments on user messages */
  images: z.array(z.string()).optional(),
});

const bodySchema = z.object({
  messages: z.array(messageSchema),
  /** DB id of the selected model (from models table). Falls back to env config if omitted. */
  modelId: z.number().int().optional(),
});

type Msg = z.infer<typeof messageSchema>;

/** Convert our message format to AI SDK CoreMessage format (supports vision) */
function toCoreMessage(msg: Msg) {
  if (msg.role === 'assistant' || !msg.images?.length) {
    return { role: msg.role as 'user' | 'assistant', content: msg.content };
  }
  return {
    role: 'user' as const,
    content: [
      { type: 'text' as const, text: msg.content },
      ...msg.images.map((url) => ({
        type: 'image' as const,
        image: url,
      })),
    ],
  };
}

export default defineEventHandler(async (event) => {
  const { messages, modelId } = await readValidatedBody(
    event,
    bodySchema.parse,
  );

  let providerModel: ReturnType<ReturnType<typeof createOpenAICompatible>>;

  if (modelId) {
    // Look up model + provider from DB
    const [row] = await db
      .select({
        modelId: schema.models.modelId,
        baseUrl: schema.providers.baseUrl,
        apiKey: schema.providers.apiKey,
      })
      .from(schema.models)
      .innerJoin(
        schema.providers,
        eq(schema.models.providerId, schema.providers.id),
      )
      .where(eq(schema.models.id, modelId))
      .limit(1);

    if (!row)
      throw createError({ statusCode: 400, message: 'Model not found' });

    const provider = createOpenAICompatible({
      name: 'custom',
      baseURL: row.baseUrl,
      apiKey: row.apiKey || 'none',
    });
    providerModel = provider(row.modelId);
  } else {
    // Fallback to environment variables
    const config = useRuntimeConfig();
    const provider = createOpenAICompatible({
      name: 'fallback',
      baseURL: (config.openaiBaseUrl as string) || 'https://api.openai.com/v1',
      apiKey: (config.openaiApiKey as string) || 'none',
    });
    providerModel = provider((config.openaiModel as string) || 'gpt-4o');
  }

  const result = streamText({
    model: providerModel,
    system: SYSTEM_PROMPT,
    messages: messages.map(toCoreMessage),
  });

  return result.toTextStreamResponse();
});
