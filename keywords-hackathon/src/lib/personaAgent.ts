import { SupabaseClient } from '@supabase/supabase-js';
import {
  createServerSupabaseClient,
  insertPersona,
  getPersonaById,
  updatePersonaProfile,
  insertResponse,
  insertDecisionTrace,
  insertPromptRun,
  getResponseByKeys,
  PersonaRow,
  ResponseRow,
} from './supabase';
import {
  callPrompt,
  callPromptWithRepair,
  sha256Hash,
  PromptCallResult,
} from './keywordsClient';
import {
  validatePersonaProfile,
  validatePersonaResponse,
  validateDecisionTrace,
  parseJSONSafe,
  PersonaProfile,
  PersonaResponse,
  DecisionTrace,
} from './schemas';

// ============================================================================
// Environment variable getters (with local prompt fallback)
// ============================================================================
function getPromptPersonaProfileId(): string {
  return process.env.PROMPT_PERSONA_PROFILE_ID || 'local:persona_profile';
}

function getPromptPersonaResponseId(): string {
  return process.env.PROMPT_PERSONA_RESPONSE_ID || 'local:persona_response';
}

function getPromptDecisionTraceId(): string {
  return process.env.PROMPT_DECISION_TRACE_ID || 'local:decision_trace';
}

// ============================================================================
// Types
// ============================================================================
export interface RunPersonaOnVariantInput {
  experiment_id: string;
  variant_id: string;
  persona_id: string;
  demographics: Record<string, unknown>;
  profile: PersonaProfile;
  user_prompt: string;
  questions: unknown[];
  stimulus: Record<string, unknown>;
}

export interface BuildDecisionTraceInput {
  response_id: string;
  experiment_id: string;
  persona_id: string;
  demographics: Record<string, unknown>;
  profile: PersonaProfile;
  stimulus: Record<string, unknown>;
  response: PersonaResponse;
}

// ============================================================================
// Helper: Log prompt run to database
// ============================================================================
async function logPromptRun(
  client: SupabaseClient,
  options: {
    experimentId?: string;
    personaId?: string;
    responseId?: string;
    promptId: string;
    result?: PromptCallResult;
    error?: string;
  }
): Promise<void> {
  try {
    await insertPromptRun(client, {
      experiment_id: options.experimentId ?? null,
      persona_id: options.personaId ?? null,
      response_id: options.responseId ?? null,
      prompt_id: options.promptId,
      model: options.result?.model ?? null,
      input_hash: options.result?.inputHash ?? null,
      output_hash: options.result?.outputHash ?? null,
      latency_ms: options.result?.latencyMs ?? null,
      input_tokens: options.result?.inputTokens ?? null,
      output_tokens: options.result?.outputTokens ?? null,
      cost_usd: null, // Cost calculation can be added later
      error: options.error ?? null,
    });
  } catch (err) {
    console.error('Failed to log prompt run:', err);
  }
}

// ============================================================================
// Helper: Parse and validate with retry
// ============================================================================
async function parseAndValidateWithRetry<T>(
  client: SupabaseClient,
  promptId: string,
  variables: Record<string, unknown>,
  validator: (data: unknown) => T,
  logOptions: {
    experimentId?: string;
    personaId?: string;
    responseId?: string;
  }
): Promise<{ data: T; result: PromptCallResult } | null> {
  // First attempt
  let result: PromptCallResult;
  try {
    result = await callPrompt(promptId, variables);
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    await logPromptRun(client, {
      ...logOptions,
      promptId,
      error: `API call failed: ${errorMsg}`,
    });
    console.error(`[PersonaAgent] Prompt call failed: ${errorMsg}`);
    return null;
  }

  // Parse JSON
  const parsed = parseJSONSafe(result.content);
  if (parsed !== null) {
    try {
      const validated = validator(parsed);
      await logPromptRun(client, { ...logOptions, promptId, result });
      return { data: validated, result };
    } catch (validationError) {
      console.warn(`[PersonaAgent] Validation failed, attempting repair...`);
    }
  } else {
    console.warn(`[PersonaAgent] JSON parsing failed, attempting repair...`);
  }

  // Retry with repair mode
  try {
    result = await callPromptWithRepair(promptId, variables, result.content);
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    await logPromptRun(client, {
      ...logOptions,
      promptId,
      error: `Repair API call failed: ${errorMsg}`,
    });
    console.error(`[PersonaAgent] Repair prompt call failed: ${errorMsg}`);
    return null;
  }

  // Parse repaired JSON
  const repairedParsed = parseJSONSafe(result.content);
  if (repairedParsed === null) {
    await logPromptRun(client, {
      ...logOptions,
      promptId,
      result,
      error: 'JSON parsing failed after repair',
    });
    console.error(`[PersonaAgent] JSON parsing failed even after repair`);
    return null;
  }

  try {
    const validated = validator(repairedParsed);
    await logPromptRun(client, { ...logOptions, promptId, result });
    return { data: validated, result };
  } catch (validationError) {
    const errorMsg =
      validationError instanceof Error ? validationError.message : String(validationError);
    await logPromptRun(client, {
      ...logOptions,
      promptId,
      result,
      error: `Validation failed after repair: ${errorMsg}`,
    });
    console.error(`[PersonaAgent] Validation failed even after repair: ${errorMsg}`);
    return null;
  }
}

// ============================================================================
// ensurePersonaStored: Insert persona and return persona_id
// ============================================================================
export async function ensurePersonaStored(
  demographics: Record<string, unknown>,
  client?: SupabaseClient
): Promise<string> {
  const db = client ?? createServerSupabaseClient();
  const persona = await insertPersona(db, demographics);
  return persona.persona_id;
}

// ============================================================================
// ensurePersonaProfile: Generate profile via LLM if empty
// ============================================================================
export async function ensurePersonaProfile(
  personaId: string,
  demographics: Record<string, unknown>,
  client?: SupabaseClient
): Promise<PersonaProfile | null> {
  const db = client ?? createServerSupabaseClient();

  // Check if profile already exists
  const persona = await getPersonaById(db, personaId);
  if (!persona) {
    throw new Error(`Persona not found: ${personaId}`);
  }

  // If profile is not empty, return it
  if (persona.profile && Object.keys(persona.profile).length > 0) {
    try {
      return validatePersonaProfile(persona.profile);
    } catch {
      console.warn(`[PersonaAgent] Existing profile invalid, regenerating...`);
    }
  }

  // Generate profile via LLM
  const promptId = getPromptPersonaProfileId();
  const variables = {
    demographics_json: JSON.stringify(demographics),
  };

  const result = await parseAndValidateWithRetry<PersonaProfile>(
    db,
    promptId,
    variables,
    validatePersonaProfile,
    { personaId }
  );

  if (!result) {
    console.error(`[PersonaAgent] Failed to generate profile for persona ${personaId}`);
    return null;
  }

  // Update persona with profile
  await updatePersonaProfile(db, personaId, result.data as Record<string, unknown>);

  console.log(`[PersonaAgent] Generated profile for persona ${personaId}`);
  return result.data;
}

// ============================================================================
// runPersonaOnVariant: Generate response via LLM and insert to DB
// ============================================================================
export async function runPersonaOnVariant(
  input: RunPersonaOnVariantInput,
  client?: SupabaseClient
): Promise<ResponseRow | null> {
  const db = client ?? createServerSupabaseClient();

  // Check if response already exists
  const existing = await getResponseByKeys(
    db,
    input.experiment_id,
    input.variant_id,
    input.persona_id
  );
  if (existing) {
    console.log(
      `[PersonaAgent] Response already exists for experiment=${input.experiment_id}, variant=${input.variant_id}, persona=${input.persona_id}`
    );
    return existing;
  }

  // Generate response via LLM
  const promptId = getPromptPersonaResponseId();
  const variables = {
    persona_profile_json: JSON.stringify(input.profile),
    demographics_json: JSON.stringify(input.demographics),
    user_prompt: input.user_prompt,
    questions_json: JSON.stringify(input.questions),
    stimulus_json: JSON.stringify(input.stimulus),
    repair_mode: false,
  };

  const result = await parseAndValidateWithRetry<PersonaResponse>(
    db,
    promptId,
    variables,
    validatePersonaResponse,
    { experimentId: input.experiment_id, personaId: input.persona_id }
  );

  if (!result) {
    console.error(
      `[PersonaAgent] Failed to generate response for persona ${input.persona_id} on variant ${input.variant_id}`
    );
    return null;
  }

  const personaResponse = result.data;

  // Insert response to DB
  const responseRow = await insertResponse(db, {
    experiment_id: input.experiment_id,
    variant_id: input.variant_id,
    persona_id: input.persona_id,
    purchase_intent: personaResponse.scores.purchase_intent,
    trust: personaResponse.scores.trust,
    clarity: personaResponse.scores.clarity,
    differentiation: personaResponse.scores.differentiation,
    would_try: personaResponse.verdict.would_try,
    would_pay: personaResponse.verdict.would_pay,
    free_text: personaResponse.free_text,
    extra: {
      top_objections: personaResponse.top_objections,
      what_would_change_my_mind: personaResponse.what_would_change_my_mind,
      confidence: personaResponse.confidence,
      uncertainty_notes: personaResponse.uncertainty_notes,
    },
  });

  console.log(
    `[PersonaAgent] Generated response ${responseRow.response_id} for persona ${input.persona_id} on variant ${input.variant_id}`
  );
  return responseRow;
}

// ============================================================================
// buildDecisionTrace: Generate decision trace via LLM and insert to DB
// ============================================================================
export async function buildDecisionTrace(
  input: BuildDecisionTraceInput,
  client?: SupabaseClient
): Promise<DecisionTrace | null> {
  const db = client ?? createServerSupabaseClient();

  // Generate decision trace via LLM
  const promptId = getPromptDecisionTraceId();
  const variables = {
    persona_profile_json: JSON.stringify(input.profile),
    demographics_json: JSON.stringify(input.demographics),
    stimulus_json: JSON.stringify(input.stimulus),
    response_json: JSON.stringify(input.response),
  };

  const result = await parseAndValidateWithRetry<DecisionTrace>(
    db,
    promptId,
    variables,
    validateDecisionTrace,
    {
      experimentId: input.experiment_id,
      personaId: input.persona_id,
      responseId: input.response_id,
    }
  );

  if (!result) {
    console.error(
      `[PersonaAgent] Failed to generate decision trace for response ${input.response_id}`
    );
    return null;
  }

  const trace = result.data;

  // Insert decision trace to DB
  await insertDecisionTrace(db, {
    response_id: input.response_id,
    persona_factors_used: trace.persona_factors_used,
    stimulus_cues: trace.stimulus_cues,
    top_objections: trace.top_objections,
    what_would_change_my_mind: trace.what_would_change_my_mind,
    confidence: trace.confidence,
    uncertainty_notes: trace.uncertainty_notes,
    audit: {
      generated_at: new Date().toISOString(),
      model: result.result.model,
      latency_ms: result.result.latencyMs,
    },
  });

  console.log(`[PersonaAgent] Generated decision trace for response ${input.response_id}`);
  return trace;
}

// ============================================================================
// runExperimentForPersona: Full pipeline for one persona across all variants
// ============================================================================
export async function runExperimentForPersona(
  experimentId: string,
  demographics: Record<string, unknown>,
  userPrompt: string,
  questions: unknown[],
  variants: Array<{ variant_id: string; variant_key: string; stimulus: Record<string, unknown> }>,
  client?: SupabaseClient
): Promise<{
  personaId: string;
  profile: PersonaProfile | null;
  responses: Array<{ variantKey: string; response: ResponseRow | null; trace: DecisionTrace | null }>;
}> {
  const db = client ?? createServerSupabaseClient();

  // Step 1: Store persona
  const personaId = await ensurePersonaStored(demographics, db);
  console.log(`[PersonaAgent] Persona stored: ${personaId}`);

  // Step 2: Generate profile
  const profile = await ensurePersonaProfile(personaId, demographics, db);
  if (!profile) {
    console.error(`[PersonaAgent] Failed to generate profile, skipping variants`);
    return { personaId, profile: null, responses: [] };
  }

  // Step 3: Run on each variant
  const responses: Array<{
    variantKey: string;
    response: ResponseRow | null;
    trace: DecisionTrace | null;
  }> = [];

  for (const variant of variants) {
    console.log(`[PersonaAgent] Processing variant ${variant.variant_key}...`);

    // Generate response
    const response = await runPersonaOnVariant(
      {
        experiment_id: experimentId,
        variant_id: variant.variant_id,
        persona_id: personaId,
        demographics,
        profile,
        user_prompt: userPrompt,
        questions,
        stimulus: variant.stimulus,
      },
      db
    );

    if (!response) {
      responses.push({ variantKey: variant.variant_key, response: null, trace: null });
      continue;
    }

    // Build PersonaResponse object from response row for decision trace
    const personaResponseObj: PersonaResponse = {
      scores: {
        purchase_intent: response.purchase_intent,
        trust: response.trust,
        clarity: response.clarity,
        differentiation: response.differentiation,
      },
      verdict: {
        would_try: response.would_try,
        would_pay: response.would_pay,
      },
      free_text: response.free_text,
      top_objections: (response.extra as { top_objections?: string[] })?.top_objections ?? [],
      what_would_change_my_mind:
        (response.extra as { what_would_change_my_mind?: string[] })?.what_would_change_my_mind ??
        [],
      confidence: (response.extra as { confidence?: number })?.confidence ?? 0.5,
      uncertainty_notes:
        (response.extra as { uncertainty_notes?: string[] })?.uncertainty_notes ?? [],
    };

    // Generate decision trace
    const trace = await buildDecisionTrace(
      {
        response_id: response.response_id,
        experiment_id: experimentId,
        persona_id: personaId,
        demographics,
        profile,
        stimulus: variant.stimulus,
        response: personaResponseObj,
      },
      db
    );

    responses.push({ variantKey: variant.variant_key, response, trace });
  }

  return { personaId, profile, responses };
}
