import { SimulationResult, Idea, Argument, Persona } from "./types";
import { generateMockResult } from "./mockData";
import { keywords, MODELS } from "@/lib/keywords";
import { SYSTEM_PROMPTS } from "./prompts";
import { generateText } from "ai";

interface SimulationOptions {
  useMock?: boolean;
  personaCount?: number;
  intensityMode?: "war_room" | "quick";
}

// Helper to safe parse JSON from LLM
const parseJSON = (text: string) => {
  try {
    // Remove markdown code blocks if present
    const cleanText = text.replace(/```json\n?|\n?```/g, "");
    return JSON.parse(cleanText);
  } catch (e) {
    console.error("Failed to parse LLM JSON:", text);
    throw new Error("Invalid JSON response from AI");
  }
};

export async function runSimulation(
  ideas: Idea[],
  mode: "single" | "compare",
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
    console.log(`[Director] Analyzing ${ideas.length} idea(s) in ${mode} mode...`);

    let directorPrompt = "";
    if (mode === "compare" && ideas.length >= 2) {
      directorPrompt = `Mode: COMPARE\nIdea A: ${ideas[0].title} - ${ideas[0].description}\nIdea B: ${ideas[1].title} - ${ideas[1].description}`;
    } else {
      directorPrompt = `Idea: ${ideas[0].title}\nContext: ${ideas[0].description}\nMode: SINGLE`;
    }

    const directorResult = await generateText({
      model: keywords.chat(MODELS.DIRECTOR),
      system: SYSTEM_PROMPTS.DIRECTOR,
      prompt: directorPrompt,
    });

    const directorOutput = parseJSON(directorResult.text);
    const personas: Persona[] = directorOutput.personas || [];
    const risks = directorOutput.risks || [];
    const plan = directorOutput.plan || [];
    const scorecard = directorOutput.scorecard || {};
    const recommendation = directorOutput.recommendation || {};

    // --- Step 2: Spawners (Personas) ---
    console.log(`[Spawners] Spawning ${personas.length} personas...`);

    let argumentsList: Argument[] = [];

    if (mode === "compare" && ideas.length >= 2) {
      const argumentPromises = personas.map(async (persona) => {
        const spawnerResult = await generateText({
          model: keywords.chat(MODELS.SPAWNER),
          system: SYSTEM_PROMPTS.SPAWNER_COMPARE(ideas[0], ideas[1], persona),
          prompt: "Compare these ideas.",
        });

        const output = parseJSON(spawnerResult.text);

        const argA: Argument = {
          personaId: persona.id,
          ideaId: ideas[0].id,
          stance: output.analysisA?.stance || "neutral",
          forPoints: output.analysisA?.forPoints || [],
          againstPoints: output.analysisA?.againstPoints || [],
          thoughtProcess: `[Comparison Preference: ${output.preference}] ${output.thoughtProcess || ""}`,
        };

        const argB: Argument = {
          personaId: persona.id,
          ideaId: ideas[1].id,
          stance: output.analysisB?.stance || "neutral",
          forPoints: output.analysisB?.forPoints || [],
          againstPoints: output.analysisB?.againstPoints || [],
          thoughtProcess: `[Comparison Preference: ${output.preference}] ${output.thoughtProcess || ""}`,
        };

        return [argA, argB];
      });

      const results = await Promise.all(argumentPromises);
      argumentsList = results.flat();
    } else {
      const argumentPromises = personas.map(async (persona) => {
        const spawnerResult = await generateText({
          model: keywords.chat(MODELS.SPAWNER),
          system: SYSTEM_PROMPTS.SPAWNER(ideas[0], persona),
          prompt: "Critique this idea.",
        });

        const output = parseJSON(spawnerResult.text);

        return {
          personaId: persona.id,
          ideaId: ideas[0].id,
          stance: output.stance || "neutral",
          forPoints: output.forPoints || [],
          againstPoints: output.againstPoints || [],
          thoughtProcess: output.thoughtProcess || "No thoughts provided.",
        } as Argument;
      });

      argumentsList = await Promise.all(argumentPromises);
    }

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
      plan,
    };
  } catch (error) {
    console.error("Simulation failed:", error);
    // Fallback to mock if AI fails
    return generateMockResult(ideas[0]);
  }
}
