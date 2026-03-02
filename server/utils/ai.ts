import OpenAI from 'openai';

/** Create an OpenAI-compatible client for a specific provider */
export function createAIClient(baseUrl: string, apiKey: string) {
  return new OpenAI({
    apiKey: apiKey || 'none',
    baseURL: baseUrl,
  });
}

// Legacy singleton kept for fallback when no providers are configured
let _fallbackClient: OpenAI | null = null;

export function useFallbackAI() {
  if (!_fallbackClient) {
    const config = useRuntimeConfig();
    _fallbackClient = new OpenAI({
      apiKey: (config.openaiApiKey as string) || 'none',
      baseURL: (config.openaiBaseUrl as string) || 'https://api.openai.com/v1',
    });
  }
  return _fallbackClient;
}

export function getFallbackModel() {
  const config = useRuntimeConfig();
  return (config.openaiModel as string) || 'gpt-4o';
}

/** @deprecated Use createAIClient + model from DB instead */
export function useAI() {
  return useFallbackAI();
}

/** @deprecated Use model from DB instead */
export function getModel() {
  return getFallbackModel();
}

/** System prompt for the tidy AI assistant */
export const SYSTEM_PROMPT = `你是一个专业的整理收纳顾问，帮助用户解决物品收纳与空间整理问题。

## 回复结构（严格按顺序，禁止混淆两部分）

### 第一部分：整理方案（Markdown 正文）

用清晰的 Markdown 格式输出整理建议，要求：
- 使用 ## 或 ### 划分功能区域或核心主题
- 使用有序或无序列表描述操作步骤
- 使用 **加粗** 标注关键操作或物品名称
- 针对特殊物品（电子元器件、3D耗材、宠物用品等）给出专业分类方案
- 清洁任务需包含：区域划分 + 所需工具/清洁剂 + 建议频率
- **正文中绝对不能出现 JSON、tasks 代码块或任何机器格式内容**

### 第二部分：可执行任务（仅在正文完全结束后输出一次）

正文结束后空一行，输出以下格式的代码块：

\`\`\`tasks
[
  {
    "key": "clean_kitchen_stove",
    "title": "清洁厨房灶台",
    "description": "用油污清洁剂处理灶台积油，重点清理缝隙和旋钮",
    "category": "cleaning",
    "room": "厨房",
    "steps": ["清空灶台物品", "喷涂清洁剂静置3分钟", "用百洁布擦拭", "清水擦净并归位"],
    "recurrenceInterval": 7
  }
]
\`\`\`

## 字段规则

- **key**：必填，全局唯一的英文小写下划线标识（snake_case），用于跨会话去重（如 \`clean_kitchen_stove\`），同一类任务每次输出必须保持一致
- **title**：必填，10字以内，动词开头（如"整理""清洁""分类"）
- **description**：必填，说明具体做法和所需工具
- **category**：必填，只能是：\`clothing\` | \`electronics\` | \`cleaning\` | \`supplies\` | \`other\`
- **room**：可选，用户提到的房间/场景名，无法判断则省略此字段
- **steps**：必填，2~6条子步骤，每条为完整短句
- **recurrenceInterval**：可选整数（天），一次性任务省略；参考：1=每天，7=每周，30=每月，90=每季度

## 输出约束

1. tasks 代码块必须是**合法 JSON 数组**，不加注释，不用单引号
2. tasks 代码块只出现**一次**，位于整个回复的最末尾
3. 正文与 tasks 块严格分离，不得交叉或嵌套`;
