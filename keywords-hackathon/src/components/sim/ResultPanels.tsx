"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SimulationResult, Risk, PlanItem } from "@/lib/sim/types";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle, ShieldAlert, Target, GitMerge } from "lucide-react";
import { DecisionTree } from "./DecisionTree";

interface ResultPanelsProps {
  result: SimulationResult;
}

export function ResultPanels({ result }: ResultPanelsProps) {
  const [activeTab, setActiveTab] = useState("summary");

  return (
    <Card className="h-full bg-card/30 backdrop-blur-xl border-border/40 flex flex-col overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          Mission Report
        </CardTitle>
        <CardDescription>Run ID: {result.runId.slice(0, 8)}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden p-0">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <div className="px-6 border-b border-border/40 pb-4">
            <TabsList className="w-full flex bg-muted/40 p-1 h-11 rounded-lg gap-2">
              <TabsTrigger
                value="summary"
                className="flex-1 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm rounded-md transition-all h-full flex items-center justify-center font-medium"
              >
                Summary
              </TabsTrigger>
              <TabsTrigger
                value="risks"
                className="flex-1 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm rounded-md transition-all h-full flex items-center justify-center font-medium"
              >
                Risks
              </TabsTrigger>
              <TabsTrigger
                value="plan"
                className="flex-1 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm rounded-md transition-all h-full flex items-center justify-center font-medium"
              >
                Plan
              </TabsTrigger>
              <TabsTrigger
                value="logic"
                className="flex-1 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm rounded-md transition-all h-full flex items-center justify-center font-medium"
              >
                Logic Trace
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Logic Trace - Full height, no ScrollArea */}
          {activeTab === "logic" && (
            <div className="flex-1 mt-0 overflow-hidden p-6">
              <DecisionTree result={result} />
            </div>
          )}

          {/* Other tabs - with ScrollArea */}
          {activeTab !== "logic" && (
            <ScrollArea className="flex-1 p-6 overflow-x-hidden">
              {activeTab === "summary" && (
                <div className="mt-0 space-y-6 overflow-hidden">
              <div className="space-y-4 overflow-hidden">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-background/50 border border-border/50">
                    <div className="text-2xl font-bold text-primary">
                      {result.scorecard.desirability}%
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Desirability
                    </div>
                  </div>
                  <div className="p-4 rounded-lg bg-background/50 border border-border/50">
                    <div className="text-2xl font-bold text-primary">
                      {result.scorecard.feasibility}%
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Feasibility
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-primary/5 border border-primary/10 overflow-hidden">
                  <h3 className="font-semibold mb-2 text-primary break-words">
                    Recommendation
                  </h3>
                  <p className="text-sm break-words whitespace-pre-wrap">{result.recommendation.summary}</p>
                </div>

                <div className="overflow-hidden">
                  <h3 className="font-semibold mb-2 break-words">
                    Scorecard Justification
                  </h3>
                  <p className="text-sm text-muted-foreground break-words whitespace-pre-wrap">
                    {result.scorecard.justification}
                  </p>
                </div>
              </div>
                </div>
              )}

              {activeTab === "risks" && (
                <div className="mt-0 space-y-4 overflow-hidden">
              {result.risks.map((risk) => (
                <div
                  key={risk.id}
                  className="flex gap-4 p-4 rounded-lg bg-background/40 border border-border/50 overflow-hidden"
                >
                  <div className="mt-1 shrink-0">
                    {risk.severity === "high" ||
                    risk.severity === "critical" ? (
                      <ShieldAlert className="h-5 w-5 text-destructive" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-yellow-500" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1 overflow-hidden">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-semibold break-words">{risk.type} Risk</span>
                      <Badge variant="secondary" className="text-[10px] h-5 shrink-0">
                        {risk.severity.toUpperCase()}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2 break-words">
                      Likelihood: {risk.likelihood}
                    </p>
                    <div className="text-sm bg-muted/30 p-2 rounded text-muted-foreground overflow-hidden">
                      <span className="font-semibold text-foreground">
                        Mitigation:{" "}
                      </span>
                      <span className="break-words whitespace-pre-wrap">{risk.mitigation}</span>
                    </div>
                  </div>
                </div>
              ))}
                </div>
              )}

              {activeTab === "plan" && (
                <div className="mt-0 space-y-4 overflow-hidden">
              {result.plan.map((item, index) => (
                <div key={item.id} className="flex gap-4 items-start overflow-hidden">
                  <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-primary/30 bg-primary/10 text-xs font-medium text-primary">
                    {index + 1}
                  </div>
                  <div className="min-w-0 flex-1 overflow-hidden">
                    <h4 className="font-medium text-sm break-words">{item.title}</h4>
                    <p className="text-sm text-muted-foreground break-words whitespace-pre-wrap">
                      {item.description}
                    </p>
                  </div>
                </div>
              ))}
                </div>
              )}
            </ScrollArea>
          )}
        </Tabs>
      </CardContent>
    </Card>
  );
}
