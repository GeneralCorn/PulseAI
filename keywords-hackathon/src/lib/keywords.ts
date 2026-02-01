import { createOpenAI } from "@ai-sdk/openai";

const apiKey = process.env.NEXT_PUBLIC_KEYWORDS_AI_KEY;

if (!apiKey) {
  console.warn(
    "NEXT_PUBLIC_KEYWORDS_AI_KEY is not set. Simulation will fail if not using mock data."
  );
}

// Keywords AI as universal gateway for all models (OpenAI, Anthropic, etc.)
export const keywords = createOpenAI({
  baseURL: "https://api.keywordsai.co/api",
  apiKey: apiKey || "dummy-key",
});

export const MODELS = {
  DIRECTOR: "gpt-5", // Director model (GPT-5) for orchestrating and analyzing user ideas
  SPAWNER: "gpt-5-mini", // Spawner model (GPT-5-mini) for individual persona critiques
};

export const DIRECTOR_MODELS = {
  GPT_5: "gpt-5",
  GPT_4O: "gpt-4o",
  GPT_5_2: "gpt-5.2",
  CLAUDE_SONNET_4_5: "claude-sonnet-4-5-20250514",
} as const;

export type DirectorModel = typeof DIRECTOR_MODELS[keyof typeof DIRECTOR_MODELS] | "auto";
