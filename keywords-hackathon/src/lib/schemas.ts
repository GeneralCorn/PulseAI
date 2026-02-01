import { z } from 'zod';

// ============================================================================
// PERSONA PROFILE SCHEMA
// ============================================================================
export const CommunicationStyleSchema = z.object({
  tone: z.string(),
  verbosity: z.enum(['low', 'medium', 'high']),
});

export const PersonaProfileSchema = z.object({
  one_liner: z.string(),
  pain_points: z.array(z.string()),
  alternatives: z.array(z.string()),
  communication_style: CommunicationStyleSchema,
});

export type PersonaProfile = z.infer<typeof PersonaProfileSchema>;

// ============================================================================
// PERSONA RESPONSE SCHEMA
// ============================================================================
const ScoreSchema = z.number().int().min(1).max(5);

export const PersonaResponseSchema = z.object({
  scores: z.object({
    purchase_intent: ScoreSchema,
    trust: ScoreSchema,
    clarity: ScoreSchema,
    differentiation: ScoreSchema,
  }),
  verdict: z.object({
    would_try: z.boolean(),
    would_pay: z.boolean(),
  }),
  free_text: z.string(),
  top_objections: z.array(z.string()),
  what_would_change_my_mind: z.array(z.string()),
  confidence: z.number().min(0).max(1),
  uncertainty_notes: z.array(z.string()),
});

export type PersonaResponse = z.infer<typeof PersonaResponseSchema>;

// ============================================================================
// DECISION TRACE SCHEMA
// ============================================================================
const EffectEnum = z.enum(['positive', 'negative', 'neutral']);

export const PersonaFactorSchema = z.object({
  factor: z.string(),
  value: z.any(),
  effect: EffectEnum,
  note: z.string(),
});

export const StimulusCueSchema = z.object({
  cue: z.string(),
  value: z.any(),
  effect: EffectEnum,
  note: z.string(),
});

export const DecisionTraceSchema = z.object({
  persona_factors_used: z.array(PersonaFactorSchema),
  stimulus_cues: z.array(StimulusCueSchema),
  top_objections: z.array(z.string()),
  what_would_change_my_mind: z.array(z.string()),
  confidence: z.number().min(0).max(1),
  uncertainty_notes: z.array(z.string()),
});

export type DecisionTrace = z.infer<typeof DecisionTraceSchema>;

// ============================================================================
// HELPER: Parse JSON safely
// ============================================================================
export function parseJSONSafe(text: string): unknown {
  try {
    // Remove markdown code blocks if present
    const cleanText = text
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();
    return JSON.parse(cleanText);
  } catch {
    return null;
  }
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================
export function validatePersonaProfile(data: unknown): PersonaProfile {
  return PersonaProfileSchema.parse(data);
}

export function validatePersonaResponse(data: unknown): PersonaResponse {
  return PersonaResponseSchema.parse(data);
}

export function validateDecisionTrace(data: unknown): DecisionTrace {
  return DecisionTraceSchema.parse(data);
}
