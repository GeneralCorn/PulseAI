import OpenAI from 'openai';
import { createHash } from 'crypto';
import { readFileSync } from 'fs';
import { join } from 'path';
import { calculateCost, UsageMetrics } from './costCalculator';

// ============================================================================
// OpenAI client configured for KeywordsAI Gateway (lazy initialization)
// ============================================================================
let _client: OpenAI | null = null;

function getClient(): OpenAI {
  if (!_client) {
    _client = new OpenAI({
      baseURL: process.env.KEYWORDSAI_BASE_URL ?? 'https://api.keywordsai.co/api',
      apiKey: process.env.KEYWORDSAI_API_KEY ?? process.env.NEXT_PUBLIC_KEYWORDS_AI_KEY ?? '',
    });
  }
  return _client;
}

// ============================================================================
// Usage Tracking (for credit calculation)
// ============================================================================
let _accumulatedUsage: UsageMetrics[] = [];
let _totalCost = 0;
let _callCount = 0;

export function resetUsageTracker(): void {
  _accumulatedUsage = [];
  _totalCost = 0;
  _callCount = 0;
}

export function getUsageStats(): { totalCost: number; callCount: number; usageList: UsageMetrics[] } {
  return {
    totalCost: _totalCost,
    callCount: _callCount,
    usageList: [..._accumulatedUsage],
  };
}

function trackUsage(model: string, inputTokens?: number, outputTokens?: number): void {
  if (inputTokens !== undefined && outputTokens !== undefined) {
    const usage: UsageMetrics = {
      model,
      inputTokens,
      outputTokens,
    };
    _accumulatedUsage.push(usage);
    _totalCost += calculateCost(usage);
  }
  _callCount++;
}

// ============================================================================
// Types
// ============================================================================
export interface PromptCallResult {
  content: string;
  latencyMs: number;
  inputTokens?: number;
  outputTokens?: number;
  model: string;
  inputHash: string;
  outputHash: string;
}

// ============================================================================
// Utility: SHA256 hash of canonical JSON
// ============================================================================
export function sha256Hash(data: unknown): string {
  const canonical = JSON.stringify(data, Object.keys(data as object).sort());
  return createHash('sha256').update(canonical).digest('hex');
}

// ============================================================================
// Local prompt template loading and interpolation
// ============================================================================
const LOCAL_PROMPTS_DIR = join(process.cwd(), 'src', 'prompts');

// Map of local prompt IDs to file names
const LOCAL_PROMPT_FILES: Record<string, string> = {
  'local:decision_trace': 'decision_trace.txt',
  'local:persona_profile': 'persona_profile.txt',
  'local:persona_response': 'persona_response.txt',
  'local:simulation_director': 'simulation_director.txt',
  'local:experiment_summary': 'experiment_summary.txt',
};

function loadLocalPrompt(promptId: string): string {
  const fileName = LOCAL_PROMPT_FILES[promptId];
  if (!fileName) {
    throw new Error(`Unknown local prompt ID: ${promptId}`);
  }
  const filePath = join(LOCAL_PROMPTS_DIR, fileName);
  return readFileSync(filePath, 'utf-8');
}

function interpolateTemplate(template: string, variables: Record<string, unknown>): string {
  let result = template;
  
  // Handle {{#if variable}}...{{/if}} blocks
  result = result.replace(/\{\{#if (\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (_, varName, content) => {
    return variables[varName] ? content : '';
  });
  
  // Handle {{variable}} substitutions
  for (const [key, value] of Object.entries(variables)) {
    const placeholder = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
    result = result.replace(placeholder, String(value));
  }
  
  return result;
}

// ============================================================================
// Call prompt via KeywordsAI Prompt Management
// ============================================================================
export async function callPrompt(
  promptId: string,
  variables: Record<string, unknown>
): Promise<PromptCallResult> {
  // Check if this is a local prompt
  if (promptId.startsWith('local:')) {
    return callLocalPrompt(promptId, variables);
  }

  const model = process.env.PRIMARY_MODEL ?? 'gpt-5-mini';
  const startTime = Date.now();
  const inputHash = sha256Hash({ promptId, variables });

  // Use version: "latest" to use the most recent draft version (no deploy needed)
  // Try non-stream mode first
  const completion = await getClient().chat.completions.create({
    model,
    messages: [{ role: 'user', content: 'placeholder' }],
    // @ts-expect-error KeywordsAI prompt management extension
    prompt: { prompt_id: promptId, variables, override: true, version: 'latest' },
  });

  const latencyMs = Date.now() - startTime;
  const content = completion.choices[0]?.message?.content ?? '';
  const outputHash = sha256Hash(content);
  const usedModel = completion.model ?? model;

  // Track usage for credit calculation
  trackUsage(usedModel, completion.usage?.prompt_tokens, completion.usage?.completion_tokens);

  // Debug: log the raw response
  console.log(`[KeywordsAI] Prompt ${promptId} response (first 500 chars):`, content.substring(0, 500));

  return {
    content,
    latencyMs,
    inputTokens: completion.usage?.prompt_tokens,
    outputTokens: completion.usage?.completion_tokens,
    model: usedModel,
    inputHash,
    outputHash,
  };
}

// ============================================================================
// Call local prompt (file-based template)
// ============================================================================
export async function callLocalPrompt(
  promptId: string,
  variables: Record<string, unknown>
): Promise<PromptCallResult> {
  const model = process.env.PRIMARY_MODEL ?? 'gpt-5-mini';
  const startTime = Date.now();
  
  // Load and interpolate template
  const template = loadLocalPrompt(promptId);
  const promptContent = interpolateTemplate(template, variables);
  
  const inputHash = sha256Hash({ promptId, variables });

  const completion = await getClient().chat.completions.create({
    model,
    messages: [{ role: 'user', content: promptContent }],
  });

  const latencyMs = Date.now() - startTime;
  const content = completion.choices[0]?.message?.content ?? '';
  const outputHash = sha256Hash(content);
  const usedModel = completion.model ?? model;

  // Track usage for credit calculation
  trackUsage(usedModel, completion.usage?.prompt_tokens, completion.usage?.completion_tokens);

  return {
    content,
    latencyMs,
    inputTokens: completion.usage?.prompt_tokens,
    outputTokens: completion.usage?.completion_tokens,
    model: usedModel,
    inputHash,
    outputHash,
  };
}

// ============================================================================
// Call prompt with repair mode for retries
// ============================================================================
export async function callPromptWithRepair(
  promptId: string,
  variables: Record<string, unknown>,
  invalidOutput?: string
): Promise<PromptCallResult> {
  const extendedVariables = {
    ...variables,
    repair_mode: !!invalidOutput,
    ...(invalidOutput ? { invalid_output: invalidOutput } : {}),
  };

  return callPrompt(promptId, extendedVariables);
}
