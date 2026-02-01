"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SimulationResult } from "@/lib/sim/types";
import { ExperimentSummary } from "@/lib/schemas";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, ShieldAlert, Target, Loader2, TrendingUp, Users, Lightbulb } from "lucide-react";
import { DecisionTree } from "./DecisionTree";

interface ResultPanelsProps {
  result: SimulationResult;
  aiSummary?: ExperimentSummary | null;
  isLoadingSummary?: boolean;
  onGenerateSummary?: () => void;
}

export function ResultPanels({ result, aiSummary, isLoadingSummary, onGenerateSummary }: ResultPanelsProps) {
  const [activeTab, setActiveTab] = useState("summary");
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch by only rendering Tabs after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  // Helper to get severity color
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-500 bg-red-500/10 border-red-500/20';
      case 'high': return 'text-orange-500 bg-orange-500/10 border-orange-500/20';
      case 'medium': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
      case 'low': return 'text-green-500 bg-green-500/10 border-green-500/20';
      default: return 'text-muted-foreground bg-muted/10';
    }
  };

  // Helper to get sentiment color
  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'text-green-500';
      case 'negative': return 'text-red-500';
      case 'mixed': return 'text-yellow-500';
      default: return 'text-muted-foreground';
    }
  };

  // Show loading state until mounted to prevent hydration mismatch
  if (!mounted) {
    return (
      <Card className="h-full bg-card/30 backdrop-blur-xl border-border/40 flex flex-col overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Mission Report
          </CardTitle>
          <CardDescription>Run ID: {result.runId.slice(0, 8)}</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

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
                  {/* Loading State */}
                  {isLoadingSummary && !aiSummary && (
                    <div className="p-8 rounded-lg bg-primary/5 border border-primary/20 flex flex-col items-center justify-center gap-4">
                      <Loader2 className="h-8 w-8 text-primary animate-spin" />
                      <div className="text-center">
                        <p className="font-medium">Analyzing Persona Responses...</p>
                        <p className="text-sm text-muted-foreground">Generating comprehensive insights</p>
                      </div>
                    </div>
                  )}

                  {/* AI Summary Content */}
                  {aiSummary ? (
                    <div className="space-y-4 overflow-hidden">
                      {/* Overall Sentiment & Scores */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 rounded-lg bg-background/50 border border-border/50">
                          <div className={`text-2xl font-bold ${getSentimentColor(aiSummary.general_summary.overall_sentiment)}`}>
                            {aiSummary.general_summary.overall_sentiment.charAt(0).toUpperCase() + aiSummary.general_summary.overall_sentiment.slice(1)}
                          </div>
                          <div className="text-sm text-muted-foreground">Overall Sentiment</div>
                        </div>
                        <div className="p-4 rounded-lg bg-background/50 border border-border/50">
                          <div className="text-2xl font-bold text-primary">
                            {(aiSummary.general_summary.try_rate * 100).toFixed(0)}%
                          </div>
                          <div className="text-sm text-muted-foreground">Would Try Rate</div>
                        </div>
                      </div>

                      {/* Average Scores */}
                      <div className="grid grid-cols-4 gap-2">
                        {Object.entries(aiSummary.general_summary.average_scores).map(([key, value]) => (
                          <div key={key} className="p-3 rounded-lg bg-background/30 border border-border/30 text-center">
                            <div className="text-lg font-bold text-primary">{value.toFixed(1)}</div>
                            <div className="text-xs text-muted-foreground capitalize">{key.replace('_', ' ')}</div>
                          </div>
                        ))}
                      </div>

                      {/* Key Insights */}
                      <div className="p-4 rounded-lg bg-primary/5 border border-primary/10">
                        <h3 className="font-semibold mb-3 text-primary flex items-center gap-2">
                          <Lightbulb className="h-4 w-4" />
                          Key Insights
                        </h3>
                        <ul className="space-y-2">
                          {aiSummary.general_summary.key_insights.map((insight, idx) => (
                            <li key={idx} className="text-sm flex items-start gap-2">
                              <span className="text-primary mt-1">•</span>
                              <span>{insight}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Segment Breakdown */}
                      {aiSummary.general_summary.segment_breakdown.length > 0 && (
                        <div>
                          <h3 className="font-semibold mb-3 flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            Segment Analysis
                          </h3>
                          <div className="space-y-2">
                            {aiSummary.general_summary.segment_breakdown.map((segment, idx) => (
                              <div key={idx} className="p-3 rounded-lg bg-background/40 border border-border/50">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="font-medium text-sm">{segment.segment}</span>
                                  <Badge variant="outline" className={getSentimentColor(segment.sentiment)}>
                                    {segment.sentiment}
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground">{segment.reasoning}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Confidence */}
                      <div className="p-3 rounded-lg bg-muted/30 border border-border/30">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Analysis Confidence</span>
                          <Badge variant={aiSummary.confidence_assessment.recommendation_strength === 'strong' ? 'default' : 'secondary'}>
                            {(aiSummary.confidence_assessment.overall_confidence * 100).toFixed(0)}% ({aiSummary.confidence_assessment.recommendation_strength})
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ) : !isLoadingSummary && (
                    /* Error/Retry state */
                    <div className="p-8 rounded-lg bg-destructive/5 border border-destructive/20 flex flex-col items-center justify-center gap-4">
                      <AlertTriangle className="h-8 w-8 text-destructive" />
                      <div className="text-center">
                        <p className="font-medium">Failed to load analysis</p>
                        <p className="text-sm text-muted-foreground">Please refresh the page to try again</p>
                      </div>
                      {onGenerateSummary && (
                        <Button variant="outline" size="sm" onClick={onGenerateSummary}>
                          Retry
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              )}

              {activeTab === "risks" && (
                <div className="mt-0 space-y-4 overflow-hidden">
                  {aiSummary ? (
                    <>
                      {/* Critical Risks from AI */}
                      {aiSummary.risk_analysis.critical_risks.length > 0 && (
                        <div className="space-y-3">
                          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Critical Risks</h3>
                          {aiSummary.risk_analysis.critical_risks.map((risk, idx) => (
                            <div
                              key={idx}
                              className={`flex gap-4 p-4 rounded-lg border overflow-hidden ${getSeverityColor(risk.severity)}`}
                            >
                              <div className="mt-1 shrink-0">
                                {risk.severity === "high" || risk.severity === "critical" ? (
                                  <ShieldAlert className="h-5 w-5" />
                                ) : (
                                  <AlertTriangle className="h-5 w-5" />
                                )}
                              </div>
                              <div className="min-w-0 flex-1 overflow-hidden">
                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                  <span className="font-semibold break-words">{risk.risk}</span>
                                  <Badge variant="secondary" className="text-[10px] h-5 shrink-0">
                                    {risk.severity.toUpperCase()}
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground mb-2 break-words">
                                  Likelihood: {risk.likelihood} | Affected: {risk.affected_segments.join(', ')}
                                </p>
                                <div className="text-sm bg-background/50 p-2 rounded overflow-hidden">
                                  <span className="font-semibold">Evidence: </span>
                                  <span className="break-words whitespace-pre-wrap text-muted-foreground">{risk.evidence}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Common Objections */}
                      {aiSummary.risk_analysis.common_objections.length > 0 && (
                        <div className="space-y-3">
                          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Common Objections</h3>
                          {aiSummary.risk_analysis.common_objections.map((obj, idx) => (
                            <div key={idx} className="p-3 rounded-lg bg-background/40 border border-border/50">
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-medium text-sm">{obj.objection}</span>
                                <Badge variant="outline" className="text-xs">{obj.frequency}</Badge>
                              </div>
                              <p className="text-xs text-muted-foreground">Raised by: {obj.persona_types.join(', ')}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Trust Barriers & Adoption Blockers */}
                      <div className="grid grid-cols-2 gap-4">
                        {aiSummary.risk_analysis.trust_barriers.length > 0 && (
                          <div className="p-3 rounded-lg bg-red-500/5 border border-red-500/20">
                            <h4 className="font-medium text-sm mb-2 text-red-400">Trust Barriers</h4>
                            <ul className="space-y-1">
                              {aiSummary.risk_analysis.trust_barriers.map((barrier, idx) => (
                                <li key={idx} className="text-xs text-muted-foreground">• {barrier}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {aiSummary.risk_analysis.adoption_blockers.length > 0 && (
                          <div className="p-3 rounded-lg bg-orange-500/5 border border-orange-500/20">
                            <h4 className="font-medium text-sm mb-2 text-orange-400">Adoption Blockers</h4>
                            <ul className="space-y-1">
                              {aiSummary.risk_analysis.adoption_blockers.map((blocker, idx) => (
                                <li key={idx} className="text-xs text-muted-foreground">• {blocker}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </>
                  ) : isLoadingSummary ? (
                    <div className="p-8 rounded-lg bg-primary/5 border border-primary/20 flex flex-col items-center justify-center gap-4">
                      <Loader2 className="h-8 w-8 text-primary animate-spin" />
                      <p className="text-sm text-muted-foreground">Loading risk analysis...</p>
                    </div>
                  ) : (
                    <div className="p-8 rounded-lg bg-destructive/5 border border-destructive/20 flex flex-col items-center justify-center gap-4">
                      <AlertTriangle className="h-8 w-8 text-destructive" />
                      <p className="text-sm text-muted-foreground">Failed to load risk analysis</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "plan" && (
                <div className="mt-0 space-y-6 overflow-hidden">
                  {aiSummary ? (
                    <>
                      {/* Quick Wins */}
                      {aiSummary.improvement_plan.quick_wins.length > 0 && (
                        <div className="space-y-3">
                          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-green-500" />
                            Quick Wins
                          </h3>
                          {aiSummary.improvement_plan.quick_wins.map((win, idx) => (
                            <div key={idx} className="p-3 rounded-lg bg-green-500/5 border border-green-500/20">
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-medium text-sm">{win.action}</span>
                                <div className="flex gap-1">
                                  <Badge variant="outline" className="text-xs bg-green-500/10">Impact: {win.impact}</Badge>
                                  <Badge variant="outline" className="text-xs">Effort: {win.effort}</Badge>
                                </div>
                              </div>
                              <p className="text-xs text-muted-foreground">Addresses: {win.addresses.join(', ')}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Strategic Improvements */}
                      {aiSummary.improvement_plan.strategic_improvements.length > 0 && (
                        <div className="space-y-3">
                          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Strategic Improvements</h3>
                          {aiSummary.improvement_plan.strategic_improvements
                            .sort((a, b) => a.priority - b.priority)
                            .map((improvement, idx) => (
                            <div key={idx} className="flex gap-4 items-start overflow-hidden">
                              <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-primary/30 bg-primary/10 text-xs font-medium text-primary">
                                {improvement.priority}
                              </div>
                              <div className="min-w-0 flex-1 overflow-hidden">
                                <h4 className="font-medium text-sm break-words">{improvement.action}</h4>
                                <p className="text-sm text-muted-foreground break-words">{improvement.rationale}</p>
                                <p className="text-xs text-primary mt-1">Expected: {improvement.expected_outcome}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* What Would Change Minds */}
                      {aiSummary.improvement_plan.what_would_change_minds.length > 0 && (
                        <div className="space-y-3">
                          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                            <Lightbulb className="h-4 w-4 text-yellow-500" />
                            What Would Change Minds
                          </h3>
                          {aiSummary.improvement_plan.what_would_change_minds.map((item, idx) => (
                            <div key={idx} className="p-3 rounded-lg bg-yellow-500/5 border border-yellow-500/20">
                              <span className="font-medium text-sm">{item.change}</span>
                              <p className="text-xs text-muted-foreground mt-1">Impact: {item.potential_impact}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Messaging Recommendations */}
                      {aiSummary.improvement_plan.messaging_recommendations.length > 0 && (
                        <div className="space-y-3">
                          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Messaging Recommendations</h3>
                          {aiSummary.improvement_plan.messaging_recommendations.map((rec, idx) => (
                            <div key={idx} className="p-3 rounded-lg bg-background/40 border border-border/50">
                              <div className="text-xs text-red-400 mb-1">Gap: {rec.current_gap}</div>
                              <div className="text-sm font-medium">{rec.recommendation}</div>
                              <div className="text-xs text-muted-foreground mt-1">Target: {rec.target_segment}</div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Next Steps */}
                      {aiSummary.improvement_plan.next_steps.length > 0 && (
                        <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                          <h3 className="font-semibold text-sm mb-3 text-primary">Next Steps</h3>
                          <ol className="space-y-2">
                            {aiSummary.improvement_plan.next_steps.map((step, idx) => (
                              <li key={idx} className="text-sm flex items-start gap-2">
                                <span className="font-medium text-primary">{idx + 1}.</span>
                                <span>{step}</span>
                              </li>
                            ))}
                          </ol>
                        </div>
                      )}
                    </>
                  ) : isLoadingSummary ? (
                    <div className="p-8 rounded-lg bg-primary/5 border border-primary/20 flex flex-col items-center justify-center gap-4">
                      <Loader2 className="h-8 w-8 text-primary animate-spin" />
                      <p className="text-sm text-muted-foreground">Loading improvement plan...</p>
                    </div>
                  ) : (
                    <div className="p-8 rounded-lg bg-destructive/5 border border-destructive/20 flex flex-col items-center justify-center gap-4">
                      <AlertTriangle className="h-8 w-8 text-destructive" />
                      <p className="text-sm text-muted-foreground">Failed to load improvement plan</p>
                    </div>
                  )}
                </div>
              )}
            </ScrollArea>
          )}
        </Tabs>
      </CardContent>
    </Card>
  );
}
