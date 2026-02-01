import { NextRequest, NextResponse } from 'next/server';
import { generateExperimentSummary, GenerateExperimentSummaryInput } from '@/lib/personaAgent';
import { PersonaProfile, PersonaResponse } from '@/lib/schemas';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    const { experiment_id, stimulus, user_prompt, all_responses } = body as GenerateExperimentSummaryInput;
    
    if (!experiment_id || !stimulus || !user_prompt || !all_responses) {
      return NextResponse.json(
        { error: 'Missing required fields: experiment_id, stimulus, user_prompt, all_responses' },
        { status: 400 }
      );
    }

    if (!Array.isArray(all_responses) || all_responses.length === 0) {
      return NextResponse.json(
        { error: 'all_responses must be a non-empty array' },
        { status: 400 }
      );
    }

    // Generate summary
    const summary = await generateExperimentSummary({
      experiment_id,
      stimulus,
      user_prompt,
      all_responses: all_responses.map((r: {
        persona_id: string;
        demographics: Record<string, unknown>;
        profile: PersonaProfile;
        response: PersonaResponse;
      }) => ({
        persona_id: r.persona_id,
        demographics: r.demographics,
        profile: r.profile,
        response: r.response,
      })),
    });

    if (!summary) {
      return NextResponse.json(
        { error: 'Failed to generate experiment summary' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, summary });
  } catch (error) {
    console.error('[API/summary] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
