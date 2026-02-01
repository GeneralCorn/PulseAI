"use client";

import { SimulationResult } from "@/lib/sim/types";
import { PersonaCard } from "@/components/sim/PersonaCard";
import { ResultPanels } from "@/components/sim/ResultPanels";
import { DirectorChat } from "@/components/sim/DirectorChat";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ChevronRight, ChevronLeft, MessageSquare } from "lucide-react";
import { UserProfile } from "@/components/UserProfile";
import { useState } from "react";

interface SimulationViewProps {
  result: SimulationResult;
  onBack?: () => void;
  isReadOnly?: boolean;
}

export function SimulationView({
  result,
  onBack,
  isReadOnly = false,
}: SimulationViewProps) {
  const [isChatOpen, setIsChatOpen] = useState(true);
  const mainIdea = result.ideas[0];
  const compareIdea = result.ideas[1];

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
            Synthetic Pulse{" "}
            <span className="text-muted-foreground font-normal">
              / Command Center
            </span>
          </h1>
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
            <ResultPanels result={result} />
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
                <DirectorChat context={directorContext} variant="embedded" />
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
