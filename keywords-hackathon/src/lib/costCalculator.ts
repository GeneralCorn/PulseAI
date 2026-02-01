/**
 * Cost Calculator for Keywords AI API Usage
 *
 * Pricing for OpenAI models via Keywords AI (per 1M tokens):
 * Source: https://platform.openai.com/docs/pricing
 * - GPT-5.2: Input $1.75, Output $14.00
 * - GPT-5-mini: Input $0.25, Output $8.00
 * - GPT-4o: Input $2.50, Output $10.00
 * - GPT-4o-mini: Input $0.15, Output $0.60
 */

// Helper function to normalize model names
function normalizeModelName(model: string): string {
  const lowerModel = model.toLowerCase();

  // Handle GPT-5 mini variants (gpt-5-mini, gpt-5-mini-2025-08-07, etc.)
  if (lowerModel.includes("gpt-5-mini") || lowerModel.includes("gpt-5.0-mini")) {
    return "gpt-5-mini";
  }

  // Handle GPT-5.2 variants (gpt-5.2, gpt-5-2, etc.)
  if (lowerModel.includes("gpt-5.2") || lowerModel.includes("gpt-5-2")) {
    return "gpt-5.2";
  }

  // Handle GPT-4o variants
  if (lowerModel.includes("gpt-4o-mini")) {
    return "gpt-4o-mini";
  }
  if (lowerModel.includes("gpt-4o")) {
    return "gpt-4o";
  }

  return model;
}

// Pricing per 1 million tokens (in USD)
const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  "gpt-5.2": {
    input: 1.75,   // $1.75 per 1M input tokens
    output: 14.00, // $14.00 per 1M output tokens
  },
  "gpt-5-mini": {
    input: 0.25,   // $0.25 per 1M input tokens
    output: 8.00,  // $8.00 per 1M output tokens
  },
  "gpt-4o": {
    input: 2.50,   // $2.50 per 1M input tokens
    output: 10.00, // $10.00 per 1M output tokens
  },
  "gpt-4o-mini": {
    input: 0.15,   // $0.15 per 1M input tokens
    output: 0.60,  // $0.60 per 1M output tokens
  },
  // Fallback for unknown models (use GPT-4o-mini pricing)
  default: {
    input: 0.15,
    output: 0.60,
  },
};

export interface UsageMetrics {
  inputTokens: number;
  outputTokens: number;
  model: string;
}

/**
 * Calculate cost in USD for a single API call
 */
export function calculateCost(usage: UsageMetrics): number {
  const normalizedModel = normalizeModelName(usage.model);
  const pricing = MODEL_PRICING[normalizedModel] || MODEL_PRICING.default;

  const inputCost = (usage.inputTokens / 1_000_000) * pricing.input;
  const outputCost = (usage.outputTokens / 1_000_000) * pricing.output;

  return inputCost + outputCost;
}

/**
 * Calculate total cost for multiple API calls
 */
export function calculateTotalCost(usageList: UsageMetrics[]): number {
  return usageList.reduce((total, usage) => total + calculateCost(usage), 0);
}

/**
 * Format cost as USD string with 6 decimal places
 */
export function formatCost(cost: number): string {
  return `$${cost.toFixed(6)}`;
}

/**
 * Format cost as cents for display (rounds to 2 decimal places)
 */
export function formatCostCents(cost: number): string {
  return `$${cost.toFixed(2)}`;
}
