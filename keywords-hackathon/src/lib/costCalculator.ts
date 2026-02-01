/**
 * Cost Calculator for Keywords AI API Usage
 *
 * Pricing for OpenAI models via Keywords AI (per 1M tokens):
 * - GPT-4o: Input $2.50, Output $10.00
 * - GPT-4o-mini: Input $0.15, Output $0.60
 * - GPT-3.5-turbo: Input $0.50, Output $1.50
 */

// Pricing per 1 million tokens (in USD)
const MODEL_PRICING = {
  "gpt-4o": {
    input: 2.50,   // $2.50 per 1M input tokens
    output: 10.00, // $10.00 per 1M output tokens
  },
  "gpt-4o-mini": {
    input: 0.15,   // $0.15 per 1M input tokens
    output: 0.60,  // $0.60 per 1M output tokens
  },
  "gpt-3.5-turbo": {
    input: 0.50,   // $0.50 per 1M input tokens
    output: 1.50,  // $1.50 per 1M output tokens
  },
  // Legacy models (for backward compatibility)
  "gpt-5.2": {
    input: 2.50,
    output: 10.00,
  },
  "gpt-5-mini": {
    input: 0.15,
    output: 0.60,
  },
  // Fallback for unknown models
  default: {
    input: 0.15,
    output: 0.60,
  },
} as const;

export interface UsageMetrics {
  inputTokens: number;
  outputTokens: number;
  model: string;
}

/**
 * Calculate cost in USD for a single API call
 */
export function calculateCost(usage: UsageMetrics): number {
  const pricing = MODEL_PRICING[usage.model as keyof typeof MODEL_PRICING] || MODEL_PRICING.default;

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
