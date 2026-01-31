'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SimulationResult, Risk, PlanItem } from '@/lib/sim/types';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, ShieldAlert, Target } from 'lucide-react';

interface ResultPanelsProps {
  result: SimulationResult;
}

export function ResultPanels({ result }: ResultPanelsProps) {
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
        <Tabs defaultValue="summary" className="h-full flex flex-col">
          <div className="px-6">
            <TabsList className="w-full grid grid-cols-4 bg-muted/20">
              <TabsTrigger value="summary">Summary</TabsTrigger>
              <TabsTrigger value="debate">Debate</TabsTrigger>
              <TabsTrigger value="risks">Risks</TabsTrigger>
              <TabsTrigger value="plan">Plan</TabsTrigger>
            </TabsList>
          </div>

          <ScrollArea className="flex-1 p-6">
            <TabsContent value="summary" className="mt-0 space-y-6">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-background/50 border border-border/50">
                    <div className="text-2xl font-bold text-primary">{result.scorecard.desirability}%</div>
                    <div className="text-sm text-muted-foreground">Desirability</div>
                  </div>
                  <div className="p-4 rounded-lg bg-background/50 border border-border/50">
                    <div className="text-2xl font-bold text-primary">{result.scorecard.feasibility}%</div>
                    <div className="text-sm text-muted-foreground">Feasibility</div>
                  </div>
                </div>
                
                <div className="p-4 rounded-lg bg-primary/5 border border-primary/10">
                  <h3 className="font-semibold mb-2 text-primary">Recommendation</h3>
                  <p className="text-sm">{result.recommendation.summary}</p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Scorecard Justification</h3>
                  <p className="text-sm text-muted-foreground">{result.scorecard.justification}</p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="debate" className="mt-0 space-y-6">
              {result.personas.map(persona => {
                const arg = result.arguments.find(a => a.personaId === persona.id);
                if (!arg) return null;
                
                return (
                  <div key={persona.id} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{persona.name}</Badge>
                      <span className={`text-xs font-bold ${
                        arg.stance === 'support' ? 'text-green-500' : 
                        arg.stance === 'oppose' ? 'text-red-500' : 'text-yellow-500'
                      }`}>
                        {arg.stance.toUpperCase()}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="bg-green-500/5 p-3 rounded border border-green-500/10">
                        <ul className="list-disc list-inside space-y-1 text-green-100/80">
                          {arg.forPoints.map((pt, i) => <li key={i}>{pt}</li>)}
                        </ul>
                      </div>
                      <div className="bg-red-500/5 p-3 rounded border border-red-500/10">
                        <ul className="list-disc list-inside space-y-1 text-red-100/80">
                          {arg.againstPoints.map((pt, i) => <li key={i}>{pt}</li>)}
                        </ul>
                      </div>
                    </div>
                  </div>
                );
              })}
            </TabsContent>

            <TabsContent value="risks" className="mt-0 space-y-4">
              {result.risks.map(risk => (
                <div key={risk.id} className="flex gap-4 p-4 rounded-lg bg-background/40 border border-border/50">
                  <div className="mt-1">
                    {risk.severity === 'high' || risk.severity === 'critical' ? (
                      <ShieldAlert className="h-5 w-5 text-destructive" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-yellow-500" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold">{risk.type} Risk</span>
                      <Badge variant="secondary" className="text-[10px] h-5">{risk.severity.toUpperCase()}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">Likelihood: {risk.likelihood}</p>
                    <div className="text-sm bg-muted/30 p-2 rounded text-muted-foreground">
                      <span className="font-semibold text-foreground">Mitigation: </span>
                      {risk.mitigation}
                    </div>
                  </div>
                </div>
              ))}
            </TabsContent>

            <TabsContent value="plan" className="mt-0 space-y-4">
              {result.plan.map((item, index) => (
                <div key={item.id} className="flex gap-4 items-start">
                  <div className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full border border-primary/30 bg-primary/10 text-xs font-medium text-primary">
                    {index + 1}
                  </div>
                  <div>
                    <h4 className="font-medium text-sm">{item.title}</h4>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                </div>
              ))}
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </CardContent>
    </Card>
  );
}
