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

// ============================================================================
// EXPERIMENT SUMMARY SCHEMA (Aggregated analysis from all personas)
// ============================================================================
const SentimentEnum = z.enum(['positive', 'mixed', 'negative']);
const SeverityEnum = z.enum(['critical', 'high', 'medium', 'low']);
const LikelihoodEnum = z.enum(['high', 'medium', 'low']);
const ImpactEffortEnum = z.enum(['high', 'medium', 'low']);
const RecommendationStrengthEnum = z.enum(['strong', 'moderate', 'weak']);

export const SegmentBreakdownSchema = z.object({
  segment: z.string(),
  sentiment: SentimentEnum,
  reasoning: z.string(),
});

export const CriticalRiskSchema = z.object({
  risk: z.string(),
  affected_segments: z.array(z.string()),
  severity: SeverityEnum,
  likelihood: LikelihoodEnum,
  evidence: z.string(),
});

export const CommonObjectionSchema = z.object({
  objection: z.string(),
  // Accept both string and number, coerce number to string
  frequency: z.union([z.string(), z.number()]).transform((val) => String(val)),
  persona_types: z.array(z.string()),
});

export const QuickWinSchema = z.object({
  action: z.string(),
  impact: ImpactEffortEnum,
  effort: ImpactEffortEnum,
  addresses: z.array(z.string()),
});

export const StrategicImprovementSchema = z.object({
  action: z.string(),
  rationale: z.string(),
  priority: z.number().int().min(1).max(5),
  expected_outcome: z.string(),
});

export const MindChangeSchema = z.object({
  change: z.string(),
  potential_impact: z.string(),
});

export const MessagingRecommendationSchema = z.object({
  current_gap: z.string(),
  recommendation: z.string(),
  target_segment: z.string(),
});

export const ExperimentSummarySchema = z.object({
  general_summary: z.object({
    overall_sentiment: SentimentEnum,
    average_scores: z.object({
      purchase_intent: z.number().min(1).max(5),
      trust: z.number().min(1).max(5),
      clarity: z.number().min(1).max(5),
      differentiation: z.number().min(1).max(5),
    }),
    try_rate: z.number().min(0).max(1),
    pay_rate: z.number().min(0).max(1),
    key_insights: z.array(z.string()),
    segment_breakdown: z.array(SegmentBreakdownSchema),
    consensus_points: z.array(z.string()),
    divergent_points: z.array(z.string()),
  }),
  risk_analysis: z.object({
    critical_risks: z.array(CriticalRiskSchema),
    common_objections: z.array(CommonObjectionSchema),
    trust_barriers: z.array(z.string()),
    adoption_blockers: z.array(z.string()),
  }),
  improvement_plan: z.object({
    quick_wins: z.array(QuickWinSchema),
    strategic_improvements: z.array(StrategicImprovementSchema),
    what_would_change_minds: z.array(MindChangeSchema),
    messaging_recommendations: z.array(MessagingRecommendationSchema),
    next_steps: z.array(z.string()),
  }),
  confidence_assessment: z.object({
    overall_confidence: z.number().min(0).max(1),
    sample_diversity_score: z.number().min(0).max(1),
    key_uncertainties: z.array(z.string()),
    recommendation_strength: RecommendationStrengthEnum,
  }),
});

export type ExperimentSummary = z.infer<typeof ExperimentSummarySchema>;

export function validateExperimentSummary(data: unknown): ExperimentSummary {
  return ExperimentSummarySchema.parse(data);
}
