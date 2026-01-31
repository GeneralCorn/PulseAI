import { SimulationResult, Persona, Risk, PlanItem, Idea } from './types';

export const MOCK_PERSONAS: Persona[] = [
  {
    id: 'p1',
    name: 'Sarah Chen',
    role: 'Gen Z Rights Activist',
    tags: ['Social Justice', 'Digital Native', 'Skeptical'],
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
  },
  {
    id: 'p2',
    name: 'Marcus Thorne',
    role: 'Institutional Investor',
    tags: ['ROI-Focused', 'Risk-Averse', 'Traditional'],
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Marcus',
  },
  {
    id: 'p3',
    name: 'Elena Rodriguez',
    role: 'Privacy Watchdog',
    tags: ['Data Security', 'Regulatory Compliance', 'Vocal'],
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Elena',
  },
  {
    id: 'p4',
    name: 'David Kim',
    role: 'Tech Early Adopter',
    tags: ['Innovation', 'Feature-Hungry', 'Forgiving'],
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=David',
  },
];

export const MOCK_RISKS: Risk[] = [
  {
    id: 'r1',
    type: 'PR',
    severity: 'high',
    likelihood: 'medium',
    mitigation: 'Proactive transparency campaign addressing data usage.',
  },
  {
    id: 'r2',
    type: 'Legal',
    severity: 'medium',
    likelihood: 'low',
    mitigation: 'Consult with GDPR compliance officer before launch.',
  },
  {
    id: 'r3',
    type: 'Market',
    severity: 'low',
    likelihood: 'high',
    mitigation: 'Highlight competitive differentiation in messaging.',
  },
];

export const MOCK_PLAN: PlanItem[] = [
  {
    id: 'step1',
    title: 'Phase 1: Alpha Testing',
    description: 'Release to a small closed group of Tech Early Adopters to validate core loop.',
  },
  {
    id: 'step2',
    title: 'Phase 2: Trust Building',
    description: 'Publish transparency report to appease Privacy Watchdogs.',
  },
  {
    id: 'step3',
    title: 'Phase 3: Public Launch',
    description: 'Broad marketing campaign focusing on innovation and user empowerment.',
  },
];

export const generateMockResult = (inputIdea: Idea): SimulationResult => {
  return {
    runId: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    seed: 12345,
    mode: 'single',
    ideas: [inputIdea],
    personas: MOCK_PERSONAS,
    arguments: MOCK_PERSONAS.map((p) => ({
      personaId: p.id,
      ideaId: inputIdea.id,
      stance: p.id === 'p1' || p.id === 'p3' ? 'oppose' : 'support',
      forPoints: [
        'Innovative approach to a common problem.',
        'Potential for high user engagement.',
      ],
      againstPoints: [
        'Concerns about data privacy and usage.',
        'Might be too complex for the average user.',
      ],
      thoughtProcess: `As a ${p.role}, I am primarily concerned with how this impacts my core values. While I see the potential upside, the risks regarding privacy cannot be ignored.`,
    })),
    risks: MOCK_RISKS,
    scorecard: {
      desirability: 75,
      feasibility: 80,
      clarity: 65,
      differentiation: 90,
      justification: 'Strong innovation potential but faces significant trust hurdles.',
    },
    recommendation: {
      summary: 'Proceed with caution. Prioritize trust-building features.',
    },
    plan: MOCK_PLAN,
  };
};
