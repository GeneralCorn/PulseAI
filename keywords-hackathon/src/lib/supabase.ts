import { createClient, SupabaseClient } from '@supabase/supabase-js';

// ============================================================================
// Public client (for browser/client-side use) - lazy initialization
// ============================================================================
let publicClient: SupabaseClient | null = null;

export function getPublicSupabaseClient(): SupabaseClient {
  // Return cached client if available
  if (publicClient) return publicClient;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY');
  }

  // Create the client (synchronous operation)
  const client = createClient(supabaseUrl, supabaseKey);
  
  // Assign to cache only if still null (handles theoretical race condition)
  // This ensures we always return the same instance even if multiple calls
  // somehow interleave (though unlikely in JS single-threaded model)
  if (!publicClient) {
    publicClient = client;
  }
  
  return publicClient;
}

// Legacy export for backwards compatibility (lazy getter)
// Uses a Proxy to lazily initialize and properly bind method contexts
export const supabase = new Proxy({} as SupabaseClient, {
  get(_, prop) {
    const client = getPublicSupabaseClient();
    const value = (client as unknown as Record<string, unknown>)[prop as string];
    
    // Bind functions to preserve 'this' context when methods are called
    if (typeof value === 'function') {
      return (value as (...args: unknown[]) => unknown).bind(client);
    }
    
    return value;
  },
});

// ============================================================================
// Server client (for server-side use with service role key)
// ============================================================================
let serverClient: SupabaseClient | null = null;

export function createServerSupabaseClient(): SupabaseClient {
  // Return cached client if available
  if (serverClient) return serverClient;

  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }

  // Create the client (synchronous operation)
  const client = createClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  // Assign to cache only if still null (handles theoretical race condition)
  if (!serverClient) {
    serverClient = client;
  }

  return serverClient;
}

// ============================================================================
// Type definitions for database tables
// ============================================================================
export interface PersonaRow {
  persona_id: string;
  created_at: string;
  demographics: Record<string, unknown>;
  profile: Record<string, unknown>;
}

export interface ExperimentRow {
  experiment_id: string;
  created_at: string;
  user_prompt: string;
  questions: unknown[];
}

export interface VariantRow {
  variant_id: string;
  experiment_id: string;
  variant_key: string;
  stimulus: Record<string, unknown>;
}

export interface ResponseRow {
  response_id: string;
  created_at: string;
  experiment_id: string;
  variant_id: string;
  persona_id: string;
  purchase_intent: number;
  trust: number;
  clarity: number;
  differentiation: number;
  would_try: boolean;
  would_pay: boolean;
  free_text: string;
  extra: Record<string, unknown>;
}

export interface DecisionTraceRow {
  response_id: string;
  persona_factors_used: unknown[];
  stimulus_cues: unknown[];
  top_objections: string[];
  what_would_change_my_mind: string[];
  confidence: number;
  uncertainty_notes: string[];
  audit: Record<string, unknown>;
}

export interface PromptRunRow {
  prompt_run_id?: string;
  created_at?: string;
  experiment_id?: string | null;
  persona_id?: string | null;
  response_id?: string | null;
  prompt_id?: string | null;
  model?: string | null;
  input_hash?: string | null;
  output_hash?: string | null;
  latency_ms?: number | null;
  input_tokens?: number | null;
  output_tokens?: number | null;
  cost_usd?: number | null;
  error?: string | null;
}

// ============================================================================
// PERSONAS
// ============================================================================
export async function insertPersona(
  client: SupabaseClient,
  demographics: Record<string, unknown>
): Promise<PersonaRow> {
  const { data, error } = await client
    .from('personas')
    .insert({ demographics, profile: {} })
    .select()
    .single();

  if (error) throw new Error(`Failed to insert persona: ${error.message}`);
  return data as PersonaRow;
}

export async function getPersonaById(
  client: SupabaseClient,
  personaId: string
): Promise<PersonaRow | null> {
  const { data, error } = await client
    .from('personas')
    .select('*')
    .eq('persona_id', personaId)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw new Error(`Failed to get persona: ${error.message}`);
  }
  return data as PersonaRow | null;
}

export async function updatePersonaProfile(
  client: SupabaseClient,
  personaId: string,
  profile: Record<string, unknown>
): Promise<void> {
  const { error } = await client
    .from('personas')
    .update({ profile })
    .eq('persona_id', personaId);

  if (error) throw new Error(`Failed to update persona profile: ${error.message}`);
}

// ============================================================================
// EXPERIMENTS
// ============================================================================
export async function insertExperiment(
  client: SupabaseClient,
  userPrompt: string,
  questions: unknown[] = []
): Promise<ExperimentRow> {
  const { data, error } = await client
    .from('experiments')
    .insert({ user_prompt: userPrompt, questions })
    .select()
    .single();

  if (error) throw new Error(`Failed to insert experiment: ${error.message}`);
  return data as ExperimentRow;
}

export async function getExperimentById(
  client: SupabaseClient,
  experimentId: string
): Promise<ExperimentRow | null> {
  const { data, error } = await client
    .from('experiments')
    .select('*')
    .eq('experiment_id', experimentId)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw new Error(`Failed to get experiment: ${error.message}`);
  }
  return data as ExperimentRow | null;
}

// ============================================================================
// VARIANTS
// ============================================================================
export async function insertVariant(
  client: SupabaseClient,
  experimentId: string,
  variantKey: string,
  stimulus: Record<string, unknown>
): Promise<VariantRow> {
  const { data, error } = await client
    .from('variants')
    .insert({
      experiment_id: experimentId,
      variant_key: variantKey,
      stimulus,
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to insert variant: ${error.message}`);
  return data as VariantRow;
}

export async function getVariantsByExperiment(
  client: SupabaseClient,
  experimentId: string
): Promise<VariantRow[]> {
  const { data, error } = await client
    .from('variants')
    .select('*')
    .eq('experiment_id', experimentId)
    .order('variant_key');

  if (error) throw new Error(`Failed to get variants: ${error.message}`);
  return data as VariantRow[];
}

// ============================================================================
// RESPONSES
// ============================================================================
export async function insertResponse(
  client: SupabaseClient,
  response: Omit<ResponseRow, 'response_id' | 'created_at'>
): Promise<ResponseRow> {
  const { data, error } = await client
    .from('responses')
    .insert(response)
    .select()
    .single();

  if (error) throw new Error(`Failed to insert response: ${error.message}`);
  return data as ResponseRow;
}

export async function getResponseByKeys(
  client: SupabaseClient,
  experimentId: string,
  variantId: string,
  personaId: string
): Promise<ResponseRow | null> {
  const { data, error } = await client
    .from('responses')
    .select('*')
    .eq('experiment_id', experimentId)
    .eq('variant_id', variantId)
    .eq('persona_id', personaId)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw new Error(`Failed to get response: ${error.message}`);
  }
  return data as ResponseRow | null;
}

// ============================================================================
// DECISION TRACES
// ============================================================================
export async function insertDecisionTrace(
  client: SupabaseClient,
  trace: DecisionTraceRow
): Promise<DecisionTraceRow> {
  const { data, error } = await client
    .from('decision_traces')
    .insert(trace)
    .select()
    .single();

  if (error) throw new Error(`Failed to insert decision trace: ${error.message}`);
  return data as DecisionTraceRow;
}

export async function getDecisionTraceByResponseId(
  client: SupabaseClient,
  responseId: string
): Promise<DecisionTraceRow | null> {
  const { data, error } = await client
    .from('decision_traces')
    .select('*')
    .eq('response_id', responseId)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw new Error(`Failed to get decision trace: ${error.message}`);
  }
  return data as DecisionTraceRow | null;
}

// ============================================================================
// PROMPT RUNS (Audit log)
// ============================================================================
export async function insertPromptRun(
  client: SupabaseClient,
  run: Omit<PromptRunRow, 'prompt_run_id' | 'created_at'>
): Promise<PromptRunRow> {
  const { data, error } = await client
    .from('prompt_runs')
    .insert(run)
    .select()
    .single();

  if (error) throw new Error(`Failed to insert prompt run: ${error.message}`);
  return data as PromptRunRow;
}
