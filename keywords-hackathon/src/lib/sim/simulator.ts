import {
  SimulationResult,
  Idea,
  Persona,
  PersonaResponse,
  DecisionTrace,
  Risk,
  Scorecard,
  Recommendation,
  PlanItem,
  SimulationOptions,
  Demographics,
  PersonaProfile,
} from "./types";
import {
  ensurePersonaStored,
  ensurePersonaProfile,
  runPersonaOnVariant,
  buildDecisionTrace,
} from "@/lib/personaAgent";
import {
  createServerSupabaseClient,
  insertExperiment,
  insertVariant,
} from "@/lib/supabase";
import { callPrompt, resetUsageTracker, getUsageStats } from "@/lib/keywordsClient";
import { parseJSONSafe } from "@/lib/schemas";

// ============================================================================
// Director Prompt ID
// ============================================================================
function getPromptDirectorId(): string {
  return process.env.PROMPT_SIMULATION_DIRECTOR_ID || "local:simulation_director";
}

// ============================================================================
// Director Output Schema
// ============================================================================
interface DirectorOutput {
  personas: Array<{
    demographics: Demographics;
  }>;
  risks: Risk[];
  plan: PlanItem[];
  scorecard: Scorecard;
  recommendation: Recommendation;
}

// ============================================================================
// Main Simulation Function
// ============================================================================
export async function runSimulation(
  ideas: Idea[],
  mode: "single" | "compare",
  options: SimulationOptions = {}
): Promise<SimulationResult> {
  const { personaCount = 4 } = options;
  const db = createServerSupabaseClient();

  // Reset usage tracker at the start of each simulation
  resetUsageTracker();

  try {
    const mainIdea = ideas[0];
    const userPrompt = `Evaluate the idea: ${mainIdea.title} - ${mainIdea.description}`;

    // --- Step 1: Create Experiment ---
    console.log(`[Simulator] Creating experiment...`);
    const experiment = await insertExperiment(db, userPrompt);
    const experimentId = experiment.experiment_id;
    console.log(`[Simulator] Experiment created: ${experimentId}`);

    // --- Step 2: Create Variant ---
    const stimulus = {
      title: mainIdea.title,
      description: mainIdea.description,
      ...(mode === "compare" && ideas[1]
        ? {
            compare_title: ideas[1].title,
            compare_description: ideas[1].description,
          }
        : {}),
    };
    const variant = await insertVariant(db, experimentId, "main", stimulus);
    console.log(`[Simulator] Variant created: ${variant.variant_id}`);

    // --- Step 3: Call Director to get personas demographics, risks, plan, etc. ---
    console.log(`[Simulator] Calling Director prompt...`);
    const directorStartTime = Date.now();

    let directorPromptContent = "";
    if (mode === "compare" && ideas.length >= 2) {
      directorPromptContent = `Mode: COMPARE\nIdea A: ${ideas[0].title} - ${ideas[0].description}\nIdea B: ${ideas[1].title} - ${ideas[1].description}\nPersona Count: ${personaCount}`;
    } else {
      directorPromptContent = `Idea: ${ideas[0].title}\nContext: ${ideas[0].description}\nMode: SINGLE\nPersona Count: ${personaCount}`;
    }

    const directorResult = await callPrompt(getPromptDirectorId(), {
      idea_context: directorPromptContent,
      persona_count: personaCount,
    });

    const directorDuration = Date.now() - directorStartTime;
    console.log(`[Simulator] Director completed in ${directorDuration}ms`);

    const directorOutput = parseJSONSafe(directorResult.content) as DirectorOutput | null;
    if (!directorOutput) {
      throw new Error("Failed to parse Director output");
    }

    const personaDemographics = directorOutput.personas || [];
    const risks = directorOutput.risks || [];
    const plan = directorOutput.plan || [];
    const scorecard = directorOutput.scorecard || {
      desirability: 0,
      feasibility: 0,
      clarity: 0,
      differentiation: 0,
      justification: "",
    };
    const recommendation = directorOutput.recommendation || { summary: "" };

    // --- Step 4: Process each persona in parallel ---
    console.log(`[Simulator] Processing ${personaDemographics.length} personas in parallel...`);

    const personaResults = await Promise.all(
      personaDemographics.map(async ({ demographics }, i) => {
        console.log(
          `[Simulator] Starting persona ${i + 1}/${personaDemographics.length}: ${demographics.name}`
        );

        try {
          // Store persona
          const personaId = await ensurePersonaStored(demographics, db);
          console.log(`[Simulator] Persona stored: ${personaId}`);

          // Generate profile
          const profile = await ensurePersonaProfile(personaId, demographics, db);
          if (!profile) {
            console.error(`[Simulator] Failed to generate profile for ${demographics.name}`);
            return null;
          }

          // Build persona object
          const persona: Persona = {
            persona_id: personaId,
            demographics: demographics as Demographics,
            profile: profile as PersonaProfile,
          };

          // Generate response
          const responseRow = await runPersonaOnVariant(
            {
              experiment_id: experimentId,
              variant_id: variant.variant_id,
              persona_id: personaId,
              demographics,
              profile,
              user_prompt: userPrompt,
              questions: [],
              stimulus,
            },
            db
          );

          if (!responseRow) {
            console.error(`[Simulator] Failed to generate response for ${demographics.name}`);
            return { persona, response: null, trace: null };
          }

          // Convert ResponseRow to PersonaResponse
          const personaResponse: PersonaResponse = {
            response_id: responseRow.response_id,
            persona_id: personaId,
            scores: {
              purchase_intent: responseRow.purchase_intent,
              trust: responseRow.trust,
              clarity: responseRow.clarity,
              differentiation: responseRow.differentiation,
            },
            verdict: {
              would_try: responseRow.would_try,
              would_pay: responseRow.would_pay,
            },
            free_text: responseRow.free_text,
          };

          // Build decision trace
          const trace = await buildDecisionTrace(
            {
              response_id: responseRow.response_id,
              experiment_id: experimentId,
              persona_id: personaId,
              demographics,
              profile,
              stimulus,
              response: {
                scores: personaResponse.scores,
                verdict: personaResponse.verdict,
                free_text: personaResponse.free_text,
                top_objections:
                  (responseRow.extra as { top_objections?: string[] })?.top_objections || [],
                what_would_change_my_mind:
                  (responseRow.extra as { what_would_change_my_mind?: string[] })
                    ?.what_would_change_my_mind || [],
                confidence: (responseRow.extra as { confidence?: number })?.confidence || 0.5,
                uncertainty_notes:
                  (responseRow.extra as { uncertainty_notes?: string[] })?.uncertainty_notes || [],
              },
            },
            db
          );

          console.log(`[Simulator] Completed persona ${i + 1}/${personaDemographics.length}: ${demographics.name}`);

          return {
            persona,
            response: personaResponse,
            trace: trace ? { response_id: responseRow.response_id, ...trace } : null,
          };
        } catch (err) {
          console.error(`[Simulator] Error processing persona ${demographics.name}:`, err);
          return null;
        }
      })
    );

    // Collect results from parallel processing
    const personas: Persona[] = [];
    const responses: PersonaResponse[] = [];
    const decisionTraces: DecisionTrace[] = [];

    for (const result of personaResults) {
      if (result?.persona) {
        personas.push(result.persona);
      }
      if (result?.response) {
        responses.push(result.response);
      }
      if (result?.trace) {
        decisionTraces.push(result.trace);
      }
    }

    // Get final usage stats for credit calculation
    const usageStats = getUsageStats();
    const creditUsage = usageStats.totalCost;

    // Calculate total tokens
    const totalInputTokens = usageStats.usageList.reduce((sum, u) => sum + u.inputTokens, 0);
    const totalOutputTokens = usageStats.usageList.reduce((sum, u) => sum + u.outputTokens, 0);

    console.log(
      `[Simulator] Completed: ${personas.length} personas, ${responses.length} responses, ${decisionTraces.length} traces`
    );
    console.log(
      `[Simulator] Token summary: ${totalInputTokens} input + ${totalOutputTokens} output = ${totalInputTokens + totalOutputTokens} total tokens`
    );
    console.log(
      `[Simulator] Total credit usage: $${creditUsage.toFixed(6)} (${usageStats.callCount} API calls)`
    );

    return {
      runId: crypto.randomUUID(),
      experimentId,
      createdAt: new Date().toISOString(),
      mode,
      ideas,
      personas,
      responses,
      decisionTraces,
      risks,
      scorecard,
      recommendation,
      plan,
      creditUsage,
    };
  } catch (error) {
    console.error("[Simulator] Simulation failed:", error);
    throw error;
  }
}
