import { createOpenAI } from "@ai-sdk/openai";

const apiKey = process.env.NEXT_PUBLIC_KEYWORDS_AI_KEY;
const openaiApiKey = process.env.OPENAI_API_KEY;

if (!apiKey) {
  console.warn(
    "NEXT_PUBLIC_KEYWORDS_AI_KEY is not set. Simulation will fail if not using mock data."
  );
}

// Create an OpenAI provider instance configured for Keywords AI
export const keywords = createOpenAI({
  baseURL: "https://api.keywordsai.co/api",
  apiKey: apiKey || "dummy-key",
});

// Fallback to direct OpenAI if Keywords AI fails
export const openai = openaiApiKey
  ? createOpenAI({
      apiKey: openaiApiKey,
    })
  : null;

export const MODELS = {
  DIRECTOR: "gpt-5.2", // Director model (GPT-5.2) for orchestrating and analyzing user ideas
  SPAWNER: "gpt-5-mini", // Spawner model (GPT-5-mini) for individual persona critiques
};
