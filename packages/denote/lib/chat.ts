/**
 * AI Chat utilities
 *
 * Powers the "Ask AI" chatbot widget. When an AI provider is configured,
 * uses llms-full.txt as context for LLM-powered answers. Falls back to
 * keyword-based search results when no provider is available.
 */
import { buildSearchIndex } from "./docs.ts";
import { generateFullDocs } from "./ai.ts";
import { getConfig } from "./config.ts";

let _apiKeyWarned = false;
let _missingKeyWarned = false;

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ChatRequest {
  messages: ChatMessage[];
}

export interface ChatResponse {
  message: ChatMessage;
  sources?: { title: string; slug: string }[];
  mode: "ai" | "search";
}

/**
 * Handle a chat request — delegates to AI provider or falls back to search
 */
export async function handleChat(req: ChatRequest): Promise<ChatResponse> {
  const config = getConfig();
  const aiConfig = config.ai;

  if (aiConfig?.provider) {
    return await aiChat(req, aiConfig);
  } else {
    return await searchChat(req);
  }
}

/**
 * AI-powered chat using an OpenAI-compatible API
 */
async function aiChat(
  req: ChatRequest,
  // deno-lint-ignore no-explicit-any
  aiConfig: any,
): Promise<ChatResponse> {
  const fullDocs = await generateFullDocs();
  const userMessage = req.messages[req.messages.length - 1]?.content || "";

  const systemPrompt =
    `You are a helpful documentation assistant for ${getConfig().name}. ` +
    `Answer questions based ONLY on the documentation provided below. ` +
    `If the answer isn't in the docs, say so. Be concise and helpful.\n\n` +
    `--- DOCUMENTATION ---\n${fullDocs}`;

  const messages = [
    { role: "system", content: systemPrompt },
    ...req.messages.map((m) => ({ role: m.role, content: m.content })),
  ];

  const apiUrl = aiConfig.provider.apiUrl ||
    "https://api.openai.com/v1/chat/completions";
  const model = aiConfig.provider.model || "gpt-4o-mini";
  const configApiKey = aiConfig.provider.apiKey;
  if (configApiKey && !_apiKeyWarned) {
    _apiKeyWarned = true;
    console.warn(
      "Warning: API key found in denote.config.ts. Consider using the DENOTE_AI_API_KEY environment variable instead to avoid committing secrets.",
    );
  }
  const apiKey = configApiKey || Deno.env.get("DENOTE_AI_API_KEY") || "";

  if (!apiKey && !_missingKeyWarned) {
    _missingKeyWarned = true;
    console.warn(
      "Warning: AI chat is configured but no API key found. Set DENOTE_AI_API_KEY environment variable.",
    );
  }

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: 1024,
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    console.error(`AI provider error: ${response.status}`);
    // Fall back to search on AI error
    return await searchChat(req);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content ||
    "Sorry, I couldn't generate a response.";

  // Find relevant source pages
  const sources = await findRelevantSources(userMessage);

  return {
    message: { role: "assistant", content },
    sources,
    mode: "ai",
  };
}

/**
 * Search-based fallback when no AI provider is configured
 */
async function searchChat(req: ChatRequest): Promise<ChatResponse> {
  const userMessage = req.messages[req.messages.length - 1]?.content || "";
  const sources = await findRelevantSources(userMessage);

  if (sources.length === 0) {
    return {
      message: {
        role: "assistant",
        content:
          `I couldn't find any documentation matching your question. Try rephrasing or browse the docs directly.`,
      },
      sources: [],
      mode: "search",
    };
  }

  const sourceList = sources
    .map((s) => `• **[${s.title}](/docs/${s.slug})**`)
    .join("\n");

  return {
    message: {
      role: "assistant",
      content:
        `Here are the most relevant documentation pages for your question:\n\n${sourceList}\n\nClick a link to read more. For AI-powered answers, configure an AI provider in \`denote.config.ts\`.`,
    },
    sources,
    mode: "search",
  };
}

/**
 * Find relevant documentation pages for a query
 */
async function findRelevantSources(
  query: string,
): Promise<{ title: string; slug: string }[]> {
  const index = await buildSearchIndex();
  const q = query.toLowerCase();
  const words = q.split(/\s+/).filter((w) => w.length > 2);

  const scored = index.map((item) => {
    let score = 0;
    const haystack = `${item.title} ${item.description || ""} ${
      item.aiSummary || ""
    } ${(item.aiKeywords || []).join(" ")} ${item.content}`.toLowerCase();

    for (const word of words) {
      if (item.title.toLowerCase().includes(word)) score += 10;
      if (item.aiKeywords?.some((k) => k.toLowerCase().includes(word))) {
        score += 5;
      }
      if (item.aiSummary?.toLowerCase().includes(word)) score += 3;
      if (item.description?.toLowerCase().includes(word)) score += 3;
      if (haystack.includes(word)) score += 1;
    }

    return { title: item.title, slug: item.slug, score };
  });

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map(({ title, slug }) => ({ title, slug }));
}
