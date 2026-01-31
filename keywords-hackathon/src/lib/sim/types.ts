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

export interface Risk {
  id: string;
  type: string; // e.g., "Legal", "PR", "Technical"
  severity: 'low' | 'medium' | 'high' | 'critical';
  likelihood: 'low' | 'medium' | 'high';
  mitigation: string;
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
}
