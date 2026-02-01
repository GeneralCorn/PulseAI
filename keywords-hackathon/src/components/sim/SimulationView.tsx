"use client";

import { SimulationResult } from "@/lib/sim/types";
import { ExperimentSummary } from "@/lib/schemas";
import { PersonaCard } from "@/components/sim/PersonaCard";
import { ResultPanels } from "@/components/sim/ResultPanels";
import { DirectorChat } from "@/components/sim/DirectorChat";
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

  // Generate AI Summary handler
  const handleGenerateSummary = useCallback(async () => {
    if (isLoadingSummary || aiSummary) return;
    
    setIsLoadingSummary(true);
    try {
      // Build the request payload from simulation result
      // Convert personas and arguments to the expected format
      const allResponses = result.personas.map((persona) => {
        const argument = result.arguments.find((a) => a.personaId === persona.id);
        return {
          persona_id: persona.id,
          demographics: {
            name: persona.name,
            role: persona.role,
            power_level: persona.powerLevel,
          },
          profile: {
            one_liner: persona.backstory,
            pain_points: argument?.againstPoints || [],
            alternatives: [],
            communication_style: {
              tone: "professional",
              verbosity: "medium" as const,
            },
          },
          response: {
            scores: {
              purchase_intent: Math.round((persona.sentiment / 100) * 5) || 3,
              trust: Math.round((persona.sentiment / 100) * 5) || 3,
              clarity: result.scorecard.clarity ? Math.round(result.scorecard.clarity / 20) : 3,
              differentiation: result.scorecard.differentiation ? Math.round(result.scorecard.differentiation / 20) : 3,
            },
            verdict: {
              would_try: persona.sentiment > 50,
              would_pay: persona.sentiment > 70,
            },
            free_text: argument?.thoughtProcess || "",
            top_objections: argument?.againstPoints || [],
            what_would_change_my_mind: [],
            confidence: 0.7,
            uncertainty_notes: [],
          },
        };
      });

      const response = await fetch('/api/summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          experiment_id: result.runId,
          stimulus: {
            title: mainIdea.title,
            description: mainIdea.description,
            ...(compareIdea ? { compare_title: compareIdea.title, compare_description: compareIdea.description } : {}),
          },
          user_prompt: `Evaluate the idea: ${mainIdea.title} - ${mainIdea.description}`,
          all_responses: allResponses,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate summary');
      }

      const data = await response.json();
      setAiSummary(data.summary);
    } catch (error) {
      console.error('Failed to generate AI summary:', error);
      // Could show a toast notification here
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
    Mode: ${result.mode}
    Idea A: ${mainIdea.title} - ${mainIdea.description}
    ${compareIdea ? `Idea B: ${compareIdea.title} - ${compareIdea.description}` : ""}

    Recommendation: ${JSON.stringify(result.recommendation)}
    Plan: ${JSON.stringify(result.plan)}
    Risks: ${JSON.stringify(result.risks)}
    Scorecard: ${JSON.stringify(result.scorecard)}
  `;

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
              const argument = result.arguments.find(
                (a) => a.personaId === persona.id
              )!;
              return (
                <PersonaCard
                  key={persona.id}
                  persona={persona}
                  argument={argument}
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
        <div className={`flex flex-col gap-4 min-h-0 transition-all duration-300 ${isChatOpen ? 'w-[380px]' : 'w-12'} shrink-0`}>
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
