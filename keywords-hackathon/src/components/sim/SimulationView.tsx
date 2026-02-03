"use client";

import { SimulationResult, Persona, PersonaResponse } from "@/lib/sim/types";
import { ExperimentSummary } from "@/lib/schemas";
import { PersonaCard } from "@/components/sim/PersonaCard";
import { ResultPanels } from "@/components/sim/ResultPanels";
import { DirectorChat } from "@/components/sim/DirectorChat";
import { SimulationLoading } from "@/components/sim/SimulationLoading";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ChevronRight, ChevronLeft, MessageSquare } from "lucide-react";
import { UserProfile } from "@/components/UserProfile";
import { useState, useCallback, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { History, ChevronLeft as ChevronLeftIcon, ChevronRight as ChevronRightIcon } from "lucide-react";

interface SimulationViewProps {
  result: SimulationResult;
  onBack?: () => void;
  isReadOnly?: boolean;
  simulationId?: string;
}

// Legacy data types (for backwards compatibility)
interface LegacyPersona {
  id: string;
  name: string;
  role: string;
  tags: string[];
  backstory: string;
  powerLevel: "High" | "Medium" | "Low";
  sentiment: number;
  avatarUrl?: string;
}

interface LegacyArgument {
  personaId: string;
  ideaId: string;
  stance: "support" | "oppose" | "neutral";
  forPoints: string[];
  againstPoints: string[];
  thoughtProcess: string;
}

// Helper to normalize legacy persona to new format
function normalizePersona(persona: Persona | LegacyPersona): Persona {
  // Check if it's already the new format
  if ("persona_id" in persona && "demographics" in persona) {
    return persona as Persona;
  }

  // Convert legacy format
  const legacy = persona as LegacyPersona;
  return {
    persona_id: legacy.id,
    demographics: {
      name: legacy.name,
      occupation: legacy.role,
    },
    profile: {
      one_liner: legacy.backstory,
      pain_points: legacy.tags || [],
      alternatives: [],
      communication_style: {
        tone: "professional",
        verbosity: "medium",
      },
    },
  };
}

// Helper to create response from legacy argument data
function createLegacyResponse(
  persona: Persona | LegacyPersona,
  result: SimulationResult & { arguments?: LegacyArgument[] }
): PersonaResponse | null {
  const legacyPersona = persona as LegacyPersona;
  const personaId = (persona as Persona).persona_id || legacyPersona.id;

  // Try to find matching argument from legacy data
  const argument = result.arguments?.find(
    (a) => a.personaId === personaId || a.personaId === legacyPersona.id
  );

  // Calculate scores from legacy sentiment
  const sentiment = legacyPersona.sentiment ?? 50;
  const scoreFromSentiment = Math.max(1, Math.min(5, Math.round((sentiment / 100) * 5)));

  return {
    response_id: `legacy-${personaId}`,
    persona_id: personaId,
    scores: {
      purchase_intent: scoreFromSentiment,
      trust: scoreFromSentiment,
      clarity: 3,
      differentiation: 3,
    },
    verdict: {
      would_try: sentiment > 50,
      would_pay: sentiment > 70,
    },
    free_text: argument?.thoughtProcess || legacyPersona.backstory || "",
  };
}

export function SimulationView({
  result,
  onBack,
  isReadOnly = false,
  simulationId,
}: SimulationViewProps) {
  const [isChatOpen, setIsChatOpen] = useState(true);
  const [aiSummary, setAiSummary] = useState<ExperimentSummary | null>(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [versions, setVersions] = useState<{ id: string; version: number; created_at: string }[]>([]);
  const [currentVersionIndex, setCurrentVersionIndex] = useState(0);
  const [loadingVersion, setLoadingVersion] = useState(false);

  const mainIdea = result.ideas[0];
  const compareIdea = result.ideas[1];

  // Generate AI Summary handler - handles both new and legacy data
  const handleGenerateSummary = useCallback(async () => {
    if (isLoadingSummary || aiSummary) return;

    setIsLoadingSummary(true);
    try {
      // Build the request payload from simulation result
      // Handle both new and legacy data structures
      const allResponses = result.personas.map((persona) => {
        const normalizedPersona = normalizePersona(persona as Persona | LegacyPersona);
        const personaId = normalizedPersona.persona_id;

        const response = result.responses?.find(
          (r) => r.persona_id === personaId
        );

        // Use normalized persona and either real response or legacy fallback
        const effectiveResponse = response || createLegacyResponse(
          persona as Persona | LegacyPersona,
          result as SimulationResult & { arguments?: LegacyArgument[] }
        );

        return {
          persona_id: personaId,
          demographics: normalizedPersona.demographics,
          profile: normalizedPersona.profile,
          response: effectiveResponse
            ? {
                scores: effectiveResponse.scores,
                verdict: effectiveResponse.verdict,
                free_text: effectiveResponse.free_text,
                top_objections: [],
                what_would_change_my_mind: [],
                confidence: 0.7,
                uncertainty_notes: [],
              }
            : {
                scores: { purchase_intent: 3, trust: 3, clarity: 3, differentiation: 3 },
                verdict: { would_try: false, would_pay: false },
                free_text: "",
                top_objections: [],
                what_would_change_my_mind: [],
                confidence: 0.5,
                uncertainty_notes: [],
              },
        };
      });

      const response = await fetch("/api/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          experiment_id: result.experimentId || result.runId,
          stimulus: {
            title: mainIdea.title,
            description: mainIdea.description,
            ...(compareIdea
              ? {
                  compare_title: compareIdea.title,
                  compare_description: compareIdea.description,
                }
              : {}),
          },
          user_prompt: `Evaluate the idea: ${mainIdea.title} - ${mainIdea.description}`,
          all_responses: allResponses,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to generate summary");
      }

      const data = await response.json();
      setAiSummary(data.summary);
    } catch (error) {
      console.error("Failed to generate AI summary:", error);
    } finally {
      setIsLoadingSummary(false);
    }
  }, [result, mainIdea, compareIdea, isLoadingSummary, aiSummary]);

  // Auto-generate summary on mount
  useEffect(() => {
    handleGenerateSummary();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Load simulation versions
  useEffect(() => {
    if (!simulationId || isReadOnly) return;

    const loadVersions = async () => {
      const supabase = createClient();

      // First, get the current simulation to find the parent
      const { data: currentSim } = await supabase
        .from("simulations")
        .select("id, version, parent_simulation_id, created_at")
        .eq("id", simulationId)
        .single();

      if (!currentSim) return;

      const parentId = currentSim.parent_simulation_id || currentSim.id;

      // Get all versions in this chain
      const { data: allVersions } = await supabase
        .from("simulations")
        .select("id, version, created_at")
        .or(`id.eq.${parentId},parent_simulation_id.eq.${parentId}`)
        .order("version", { ascending: true });

      if (allVersions && allVersions.length > 0) {
        setVersions(allVersions);
        // Find the current version index
        const currentIndex = allVersions.findIndex(v => v.id === simulationId);
        setCurrentVersionIndex(currentIndex >= 0 ? currentIndex : 0);
      }
    };

    loadVersions();
  }, [simulationId, isReadOnly]);

  // Navigate to a different version
  const navigateToVersion = useCallback(async (index: number) => {
    if (index < 0 || index >= versions.length || loadingVersion) return;

    setLoadingVersion(true);
    const versionId = versions[index].id;

    // Reload the page with the new version
    window.location.href = `/run/${versionId}`;
  }, [versions, loadingVersion]);

  // Context for the Director Chat
  const directorContext = `
    Simulation ID: ${result.runId}
    Experiment ID: ${result.experimentId || "N/A"}
    Mode: ${result.mode}
    Idea A: ${mainIdea.title} - ${mainIdea.description}
    ${compareIdea ? `Idea B: ${compareIdea.title} - ${compareIdea.description}` : ""}

    Recommendation: ${JSON.stringify(result.recommendation)}
    Plan: ${JSON.stringify(result.plan)}
    Risks: ${JSON.stringify(result.risks)}
    Scorecard: ${JSON.stringify(result.scorecard)}
  `;

  // Show loading screen while summary is being generated
  if (isLoadingSummary) {
    return <SimulationLoading ideaTitle={mainIdea.title} />;
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col p-4 gap-4 overflow-hidden h-screen relative">
      {/* Top Bar */}
      <header className="flex items-center justify-between shrink-0 h-14 border-b border-border/40 pb-4">
        <div className="flex items-center gap-4">
          {onBack ? (
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
          ) : (
            <Link href="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
          )}
          <h1 className="text-xl font-bold tracking-tight text-primary">
            Pulse{" "}
            <span className="text-muted-foreground font-normal">
              / Command Center
            </span>
          </h1>

          {/* Version Navigation */}
          {!isReadOnly && versions.length > 1 && (
            <div className="flex items-center gap-2 ml-4 border-l border-border/40 pl-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigateToVersion(currentVersionIndex - 1)}
                disabled={currentVersionIndex === 0 || loadingVersion}
                className="h-7"
              >
                <ChevronLeftIcon className="h-4 w-4 mr-1" />
                Previous
              </Button>
              <div className="flex items-center gap-2 px-2 py-1 bg-muted/50 rounded text-xs">
                <History className="h-3 w-3" />
                <span>
                  v{versions[currentVersionIndex]?.version || 1} of {versions.length}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigateToVersion(currentVersionIndex + 1)}
                disabled={currentVersionIndex === versions.length - 1 || loadingVersion}
                className="h-7"
              >
                Next
                <ChevronRightIcon className="h-4 w-4 ml-1" />
              </Button>
            </div>
          )}
        </div>
        <div className="flex items-center gap-4">
          {isReadOnly && (
            <span className="text-xs bg-yellow-500/10 text-yellow-500 px-2 py-1 rounded border border-yellow-500/20">
              Preview Mode (Not Saved)
            </span>
          )}
          <div className="text-sm text-muted-foreground">
            Running in <strong>{result.mode.toUpperCase()}</strong> mode
          </div>
          <UserProfile />
        </div>
      </header>

      {/* Main Grid Layout */}
      <div className="flex-1 flex gap-4 min-h-0">
        {/* Left Column: Persona Swarm */}
        <div className="w-[280px] flex flex-col gap-4 min-h-0 shrink-0">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground shrink-0">
            Stakeholder Swarm
          </h2>
          <div className="flex-1 overflow-y-auto pr-2 space-y-4 pb-4 scrollbar-thin scrollbar-thumb-primary/20">
            {result.personas.map((persona, index) => {
              // Handle both new and legacy data structures
              const personaId = persona.persona_id || (persona as unknown as { id: string }).id;
              
              const response = result.responses?.find(
                (r) => r.persona_id === personaId
              );
              const decisionTrace = result.decisionTraces?.find(
                (t) => t.response_id === response?.response_id
              );

              // For legacy data without responses, create a placeholder
              const effectiveResponse = response || createLegacyResponse(persona, result);

              // Skip if we can't create any response
              if (!effectiveResponse) return null;

              return (
                <PersonaCard
                  key={personaId}
                  persona={normalizePersona(persona)}
                  response={effectiveResponse}
                  decisionTrace={decisionTrace}
                  index={index}
                  idea={mainIdea}
                />
              );
            })}
          </div>
        </div>

        {/* Center Column: Intelligence (Mission Report) */}
        <div className="flex-1 flex flex-col gap-4 min-h-0">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground shrink-0">
            Intelligence
          </h2>
          <div className="flex-1 min-h-0">
            <ResultPanels
              result={result}
              aiSummary={aiSummary}
              isLoadingSummary={isLoadingSummary}
              onGenerateSummary={handleGenerateSummary}
            />
          </div>
        </div>

        {/* Right Column: Director Chat (Collapsible) */}
        <div
          className={`flex flex-col gap-4 min-h-0 transition-all duration-300 ${
            isChatOpen ? "w-[380px]" : "w-12"
          } shrink-0`}
        >
          {isChatOpen ? (
            <>
              <div className="flex items-center justify-between shrink-0">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Director Chat
                </h2>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setIsChatOpen(false)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex-1 min-h-0 rounded-xl border border-border/50 bg-card/30 backdrop-blur-sm overflow-hidden">
                <DirectorChat
                  context={directorContext}
                  simulationId={result.runId}
                  variant="embedded"
                  
                  
                  disabled={isLoadingSummary}
                />
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-start justify-center pt-4">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 hover:bg-primary/10"
                onClick={() => setIsChatOpen(true)}
                title="Open Director Chat"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
