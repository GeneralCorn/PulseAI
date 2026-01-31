import { SimulationResult, Idea } from './types';
import { generateMockResult } from './mockData';

// Placeholder for Keywords AI Router integration
const CALL_LLM = async (prompt: string): Promise<string> => {
  // TODO: Implement Keywords AI API call here
  console.log('Calling Keywords AI with prompt:', prompt);
  return 'LLM Response Placeholder';
};

interface SimulationOptions {
  useMock?: boolean;
  critiqueIntensity?: number;
  personaCount?: number;
}

export async function runSimulation(
  ideas: Idea[],
  mode: 'single' | 'compare',
  options: SimulationOptions = {}
): Promise<SimulationResult> {
  const { useMock = true } = options; // Default to mock for now

  if (useMock) {
    // Return mock data for the first idea
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(generateMockResult(ideas[0]));
      }, 2000); // Simulate network delay
    });
  }

  // Real simulation logic would go here
  // 1. Generate personas if not provided
  // 2. Parallel calls to LLM for each persona
  // 3. Aggregate results
  // 4. Generate plan and risks

  throw new Error('Real simulation not implemented yet. Please use mock mode.');
}
