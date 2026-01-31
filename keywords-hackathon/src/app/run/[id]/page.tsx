import { supabase } from "@/lib/supabase";
import { notFound } from "next/navigation";
import { SimulationResult } from "@/lib/sim/types";
import { PersonaCard } from "@/components/sim/PersonaCard";
import { ResultPanels } from "@/components/sim/ResultPanels";
import { DecisionTree } from "@/components/sim/DecisionTree";
import { DirectorChat } from "@/components/sim/DirectorChat";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface RunPageProps {
  params: Promise<{ id: string }>;
}

export default async function RunPage({ params }: RunPageProps) {
  const { id } = await params;

  const { data, error } = await supabase
    .from("simulations")
    .select("result_json")
    .eq("id", id)
    .single();

  if (error || !data) {
    notFound();
  }

  const result = JSON.parse(data.result_json) as SimulationResult;
  const mainIdea = result.ideas[0];

  // Context for the Director Chat
  const directorContext = `
    Simulation ID: ${result.runId}
    Idea: ${mainIdea.title}
    Description: ${mainIdea.description}
    Plan: ${JSON.stringify(result.plan)}
    Risks: ${JSON.stringify(result.risks)}
    Scorecard: ${JSON.stringify(result.scorecard)}
  `;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col p-4 gap-4 overflow-hidden h-screen relative">
      {/* Top Bar */}
      <header className="flex items-center justify-between shrink-0 h-14 border-b border-border/40 pb-4">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-xl font-bold tracking-tight text-primary">
            Synthetic Pulse{" "}
            <span className="text-muted-foreground font-normal">
              / Command Center
            </span>
          </h1>
        </div>
        <div className="text-sm text-muted-foreground">
          Running in <strong>{result.mode.toUpperCase()}</strong> mode
        </div>
      </header>

      {/* Main Grid Layout */}
      <div className="flex-1 grid grid-cols-12 gap-4 min-h-0">
        {/* Left Column: Persona Swarm */}
        <div className="col-span-3 flex flex-col gap-4 min-h-0">
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

        {/* Center Column: Logic/Decision Tree */}
        <div className="col-span-5 flex flex-col gap-4 min-h-0">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground shrink-0">
            Logic Trace
          </h2>
          <div className="flex-1 min-h-0">
            <DecisionTree result={result} />
          </div>
        </div>

        {/* Right Column: Result Panels */}
        <div className="col-span-4 flex flex-col gap-4 min-h-0">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground shrink-0">
            Intelligence
          </h2>
          <div className="flex-1 min-h-0">
            <ResultPanels result={result} />
          </div>
        </div>
      </div>

      {/* Director Chat Widget */}
      <DirectorChat context={directorContext} />
    </div>
  );
}
