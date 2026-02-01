export interface Idea {
  id: string;
  title: string;
  description: string;
}

export interface Persona {
  id: string;
  name: string;
  role: string; // e.g., "Gen Z Rights Activist"
  tags: string[]; // Psychographics
  backstory: string;
  powerLevel: 'High' | 'Medium' | 'Low';
  sentiment: number; // 0-100
  avatarUrl?: string;
}

export interface Argument {
  personaId: string;
  ideaId: string;
  stance: 'support' | 'oppose' | 'neutral';
  forPoints: string[];
  againstPoints: string[];
  thoughtProcess: string;
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

export interface Risk {
  id: string;
  type: string; // e.g., "Legal", "PR", "Technical"
  title?: string; // Short title for the risk
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

export interface SimulationResult {
  runId: string;
  createdAt: string; // ISO date
  seed: number;
  mode: 'single' | 'compare';
  ideas: Idea[];
  personas: Persona[];
  arguments: Argument[];
  risks: Risk[];
  scorecard: Scorecard;
  recommendation: Recommendation;
  plan: PlanItem[];
  creditUsage?: number; // Total cost in USD for all API calls
}
