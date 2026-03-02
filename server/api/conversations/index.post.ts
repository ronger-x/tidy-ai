import { generateText } from 'ai';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { z } from 'zod';
import { db, schema } from '~~/server/db/index';

const bodySchema = z.object({
  /** The first user message – used for AI title generation */
  userFirstMessage: z.string().optional(),
  /** Fallback title if AI generation is skipped/fails */
  title: z.string().default('新对话'),
  messages: z.array(z.any()).default([]),
});

async function generateAITitle(message: string): Promise<string | null> {
  try {
    const config = useRuntimeConfig();
    const provider = createOpenAICompatible({
      name: 'fallback',
      baseURL: (config.openaiBaseUrl as string) || 'https://api.openai.com/v1',
      apiKey: (config.openaiApiKey as string) || 'none',
    });
    const { text } = await generateText({
      model: provider((config.openaiModel as string) || 'gpt-4o'),
      system:
        '根据用户消息生成一个简短的对话标题（3~10个字，无标点符号，纯文字），只输出标题本身，不要输出任何其他内容。',
      prompt: message.slice(0, 200),
      maxOutputTokens: 20,
    });
    return text.trim().slice(0, 40) || null;
  } catch {
    return null;
  }
}

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, bodySchema.parse);
  const now = new Date();

  // Generate title: try AI first, fall back to provided title or first 30 chars
  let title = body.title;
  if (body.userFirstMessage) {
    const aiTitle = await generateAITitle(body.userFirstMessage);
    if (aiTitle) title = aiTitle;
    else
      title =
        body.userFirstMessage.length > 30
          ? body.userFirstMessage.slice(0, 30) + '…'
          : body.userFirstMessage;
  }

  const userId = event.context.userId as number;

  const [row] = await db
    .insert(schema.conversations)
    .values({
      userId,
      title,
      messages: body.messages,
      createdAt: now,
      updatedAt: now,
    })
    .returning();
  return row;
});
