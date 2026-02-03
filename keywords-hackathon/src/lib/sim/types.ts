// ============================================================================
// Idea (unchanged)
// ============================================================================
export interface Idea {
  id: string;
  title: string;
  description: string;
}

// ============================================================================
// Persona - aligned with database personas table
// ============================================================================
export interface Demographics {
  name: string;
  age?: number;
  gender?: string;
  occupation?: string;
  income_level?: string;
  location?: string;
  [key: string]: unknown;
}

export interface PersonaProfile {
  one_liner: string;
  pain_points: string[];
  alternatives: string[];
  communication_style: {
    tone: string;
    verbosity: 'low' | 'medium' | 'high';
  };
}

export interface NextStep {
  id: string;
  title: string;
  description?: string;
  chatPrefill: string;
}

export interface Option {
  id: string;
  label: string;
  summary: string;
  chatPrefill: string;
  nextStep?: NextStep;
  stop?: boolean;
  stopReason?: string;
}

export interface Persona {
  persona_id: string;
  demographics: Demographics;
  profile: PersonaProfile;
}

// ============================================================================
// PersonaResponse - aligned with database responses table
// ============================================================================
export interface PersonaResponse {
  response_id: string;
  persona_id: string;
  scores: {
    purchase_intent: number; // 1-5
    trust: number;
    clarity: number;
    differentiation: number;
  };
  verdict: {
    would_try: boolean;
    would_pay: boolean;
  };
  free_text: string;
}

// ============================================================================
// DecisionTrace - aligned with database decision_traces table
// ============================================================================
export interface PersonaFactor {
  factor: string;
  value: unknown;
  effect: 'positive' | 'negative' | 'neutral';
  note: string;
}

export interface StimulusCue {
  cue: string;
  value: unknown;
  effect: 'positive' | 'negative' | 'neutral';
  note: string;
}

export interface DecisionTrace {
  response_id: string;
  persona_factors_used: PersonaFactor[];
  stimulus_cues: StimulusCue[];
  top_objections: string[];
  what_would_change_my_mind: string[];
  confidence: number;
  uncertainty_notes: string[];
}

// ============================================================================
// Risk, Scorecard, Recommendation, PlanItem (mostly unchanged)
// ============================================================================
export interface Risk {
  id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  likelihood: 'low' | 'medium' | 'high';
  mitigation: string;
  chatPrefill?: string; // For node-click Q&A
}

export interface Scorecard {
  desirability: number;
  feasibility: number;
  clarity: number;
  differentiation: number;
  justification: string;
}

export interface Recommendation {
  winnerId?: string;
  summary: string;
}

export interface PlanItem {
  id: string;
  title: string;
  description: string;
  riskId?: string; // Which risk this plan mitigates
  chatPrefill?: string; // For node-click Q&A
  options?: Option[]; // Branching options for this plan step
}

// ============================================================================
// SimulationResult - updated to use new types
// ============================================================================
export interface SimulationResult {
  runId: string;
  experimentId: string; // corresponds to experiments table
  createdAt: string;
  mode: 'single' | 'compare';
  ideas: Idea[];
  personas: Persona[];
  responses: PersonaResponse[]; // replaces arguments
  decisionTraces: DecisionTrace[]; // new
  risks: Risk[];
  scorecard: Scorecard;
  recommendation: Recommendation;
  plan: PlanItem[];
  creditUsage?: number;
}

// ============================================================================
// Helper type for simulation options
// ============================================================================
export interface SimulationOptions {
  personaCount?: number;
  intensityMode?: 'war_room' | 'quick';
}
