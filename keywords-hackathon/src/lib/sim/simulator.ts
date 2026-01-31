import { SimulationResult, Idea, Argument, Persona } from './types';
import { generateMockResult } from './mockData';
import { keywords, MODELS } from '@/lib/keywords';
import { SYSTEM_PROMPTS } from './prompts';

interface SimulationOptions {
  useMock?: boolean;
  critiqueIntensity?: number;
  personaCount?: number;
}

// Helper to safe parse JSON from LLM
const parseJSON = (text: string) => {
  try {
    // Remove markdown code blocks if present
    const cleanText = text.replace(/```json\n?|\n?```/g, '');
    return JSON.parse(cleanText);
  } catch (e) {
    console.error('Failed to parse LLM JSON:', text);
    throw new Error('Invalid JSON response from AI');
  }
};

export async function runSimulation(
  ideas: Idea[],
  mode: 'single' | 'compare',
  options: SimulationOptions = {}
): Promise<SimulationResult> {
  const { useMock = false } = options;

  if (useMock) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(generateMockResult(ideas[0]));
      }, 2000);
    });
  }

  try {
    const mainIdea = ideas[0]; // MVP supports single idea mainly

    // --- Step 1: Director (Orchestrator) ---
    console.log('[Director] Analyzing idea:', mainIdea.title);
    const directorCompletion = await keywords.chat.completions.create({
      model: MODELS.DIRECTOR,
      messages: [
        { role: 'system', content: SYSTEM_PROMPTS.DIRECTOR },
        { role: 'user', content: `Idea: ${mainIdea.title}\nContext: ${mainIdea.description}\nMode: ${mode}` }
      ],
      response_format: { type: 'json_object' }
    });

    const directorOutput = parseJSON(directorCompletion.choices[0].message.content || '{}');
    const personas: Persona[] = directorOutput.personas || [];
    const risks = directorOutput.risks || [];
    const plan = directorOutput.plan || [];
    const scorecard = directorOutput.scorecard || {};
    const recommendation = directorOutput.recommendation || {};

    // --- Step 2: Spawners (Personas) ---
    console.log(`[Spawners] Spawning ${personas.length} personas...`);
    
    const argumentPromises = personas.map(async (persona) => {
      const spawnerCompletion = await keywords.chat.completions.create({
        model: MODELS.SPAWNER,
        messages: [
          { role: 'system', content: SYSTEM_PROMPTS.SPAWNER(mainIdea, persona) },
          { role: 'user', content: 'Critique this idea.' }
        ],
        response_format: { type: 'json_object' }
      });

      const output = parseJSON(spawnerCompletion.choices[0].message.content || '{}');
      
      return {
        personaId: persona.id,
        ideaId: mainIdea.id,
        stance: output.stance || 'neutral',
        forPoints: output.forPoints || [],
        againstPoints: output.againstPoints || [],
        thoughtProcess: output.thoughtProcess || 'No thoughts provided.'
      } as Argument;
    });

    const argumentsList = await Promise.all(argumentPromises);

    return {
      runId: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      seed: Date.now(),
      mode,
      ideas,
      personas,
      arguments: argumentsList,
      risks,
      scorecard,
      recommendation,
      plan
    };

  } catch (error) {
    console.error('Simulation failed:', error);
    // Fallback to mock if AI fails
    return generateMockResult(ideas[0]);
  }
}
