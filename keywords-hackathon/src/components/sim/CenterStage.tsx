"use client";

import { useState } from "react";
import { DirectorChat } from "./DirectorChat";
import { DecisionTree } from "./DecisionTree";
import { SimulationResult } from "@/lib/sim/types";
import { Button } from "@/components/ui/button";
import { MessageSquare, GitMerge } from "lucide-react";

interface CenterStageProps {
  result: SimulationResult;
  directorContext: string;
}

export function CenterStage({ result, directorContext }: CenterStageProps) {
  const [view, setView] = useState<"chat" | "logic">("chat");

  return (
    <div className="flex flex-col h-full gap-4">
      {/* View Toggle / Tabs */}
      <div className="flex items-center justify-center p-1 bg-muted/50 rounded-lg w-fit mx-auto border border-border/50">
        <Button
          variant={view === "chat" ? "secondary" : "ghost"}
          size="sm"
          onClick={() => setView("chat")}
          className="gap-2"
        >
          <MessageSquare className="h-4 w-4" />
          Director Chat
        </Button>
        <Button
          variant={view === "logic" ? "secondary" : "ghost"}
          size="sm"
          onClick={() => setView("logic")}
          className="gap-2"
        >
          <GitMerge className="h-4 w-4" />
          Logic Trace
        </Button>
      </div>

      {/* Content Area */}
      <div className="flex-1 min-h-0 relative">
        {view === "chat" ? (
          <DirectorChat context={directorContext} variant="embedded" />
        ) : (
          <DecisionTree result={result} />
        )}
      </div>
    </div>
  );
}
