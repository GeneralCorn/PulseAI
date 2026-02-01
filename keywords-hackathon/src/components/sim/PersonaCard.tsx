"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Persona, PersonaResponse, DecisionTrace, Idea } from "@/lib/sim/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { clsx } from "clsx";
import { useState, useEffect } from "react";
import { PersonaChatModal } from "./PersonaChatModal";
import {
  MessageSquareText,
  ChevronDown,
  ChevronUp,
  Brain,
  AlertCircle,
  Lightbulb,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface PersonaCardProps {
  persona: Persona;
  response: PersonaResponse;
  decisionTrace?: DecisionTrace;
  index: number;
  idea: Idea;
}

// Helper to derive stance from scores
function getStance(response: PersonaResponse): "support" | "oppose" | "neutral" {
  const avgScore =
    (response.scores.purchase_intent +
      response.scores.trust +
      response.scores.clarity +
      response.scores.differentiation) /
    4;
  if (avgScore >= 3.5 && response.verdict.would_try) return "support";
  if (avgScore <= 2.5 || !response.verdict.would_try) return "oppose";
  return "neutral";
}

// Helper to generate avatar URL from name
function getAvatarUrl(name: string): string {
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`;
}

// Helper to get effect color
function getEffectColor(effect: "positive" | "negative" | "neutral"): string {
  switch (effect) {
    case "positive":
      return "text-green-500 bg-green-500/10";
    case "negative":
      return "text-red-500 bg-red-500/10";
    case "neutral":
      return "text-yellow-500 bg-yellow-500/10";
  }
}

export function PersonaCard({
  persona,
  response,
  decisionTrace,
  index,
  idea,
}: PersonaCardProps) {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isTraceExpanded, setIsTraceExpanded] = useState(false);
  const [randomValues, setRandomValues] = useState({ delay: 0, duration: 4 });

  const stance = getStance(response);
  const name = persona.demographics.name;
  const occupation = persona.demographics.occupation || "Consumer";
  const avatarUrl = getAvatarUrl(name);

  useEffect(() => {
    setRandomValues({
      delay: Math.random() * 2,
      duration: 3 + Math.random() * 2,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{
          opacity: 1,
          y: [0, 8, 0],
        }}
        transition={{
          y: {
            duration: randomValues.duration,
            repeat: Infinity,
            ease: "easeInOut",
            delay: randomValues.delay,
          },
          opacity: { duration: 0.5, delay: index * 0.1 },
        }}
        className="w-full max-w-[280px]"
      >
        <Card className="bg-card/40 backdrop-blur-md border-primary/20 hover:border-primary/50 transition-all duration-300 relative overflow-hidden h-full flex flex-col">
          {/* Main Card Content - Clickable for Chat */}
          <div
            className="cursor-pointer group"
            onClick={() => setIsChatOpen(true)}
          >
            {/* Hover Effect Overlay */}
            <div className="absolute inset-0 bg-background/60 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 flex items-center justify-center pointer-events-none">
              <div className="bg-primary text-primary-foreground px-5 py-2.5 rounded-full shadow-xl transform scale-90 group-hover:scale-100 transition-transform duration-300 flex items-center gap-2 font-medium">
                <MessageSquareText className="h-4 w-4" />
                Discuss
              </div>
            </div>

            <CardHeader className="pb-3 pt-4 px-4 flex flex-row items-start gap-3 space-y-0 border-b border-border/40 bg-muted/10 min-h-[5rem]">
              <Avatar className="h-10 w-10 border border-border shadow-sm shrink-0 mt-1">
                <AvatarImage src={avatarUrl} alt={name} className="object-cover" />
                <AvatarFallback>{name[0]}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col min-w-0 justify-center h-full py-0.5 overflow-hidden">
                <CardTitle className="text-sm font-bold leading-tight break-words">
                  {name}
                </CardTitle>
                <span className="text-xs text-muted-foreground mt-0.5 break-words">
                  {occupation}
                </span>
              </div>
            </CardHeader>

            <CardContent className="p-4 flex-1 flex flex-col gap-3 overflow-hidden">
              {/* Stance and Scores */}
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div
                  className={clsx(
                    "text-[10px] font-bold px-2 py-1 rounded-md border tracking-wide uppercase flex items-center justify-center shrink-0",
                    stance === "support" &&
                      "bg-green-500/10 text-green-500 border-green-500/20",
                    stance === "oppose" &&
                      "bg-red-500/10 text-red-500 border-red-500/20",
                    stance === "neutral" &&
                      "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
                  )}
                >
                  {stance}
                </div>

                <div className="flex gap-1 flex-wrap justify-end min-w-0">
                  {persona.profile.pain_points.slice(0, 2).map((point, i) => (
                    <Badge
                      key={i}
                      variant="secondary"
                      className="text-[9px] h-5 px-1.5 text-muted-foreground font-normal border-border/50 truncate max-w-[80px]"
                    >
                      {point}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Scores Grid */}
              <div className="grid grid-cols-4 gap-1">
                <div className="text-center p-1 rounded bg-muted/30">
                  <div className="text-xs font-bold text-primary">
                    {response.scores.purchase_intent}
                  </div>
                  <div className="text-[8px] text-muted-foreground">Intent</div>
                </div>
                <div className="text-center p-1 rounded bg-muted/30">
                  <div className="text-xs font-bold text-primary">
                    {response.scores.trust}
                  </div>
                  <div className="text-[8px] text-muted-foreground">Trust</div>
                </div>
                <div className="text-center p-1 rounded bg-muted/30">
                  <div className="text-xs font-bold text-primary">
                    {response.scores.clarity}
                  </div>
                  <div className="text-[8px] text-muted-foreground">Clarity</div>
                </div>
                <div className="text-center p-1 rounded bg-muted/30">
                  <div className="text-xs font-bold text-primary">
                    {response.scores.differentiation}
                  </div>
                  <div className="text-[8px] text-muted-foreground">Diff</div>
                </div>
              </div>

              {/* One-liner / Free text */}
              <div className="relative pl-3 border-l-2 border-primary/20 mt-1 overflow-hidden">
                <p className="text-xs text-muted-foreground line-clamp-3 italic leading-relaxed break-words">
                  &ldquo;{response.free_text || persona.profile.one_liner}&rdquo;
                </p>
              </div>

              {/* Verdict badges */}
              <div className="flex gap-2 mt-auto">
                <Badge
                  variant={response.verdict.would_try ? "default" : "secondary"}
                  className="text-[9px]"
                >
                  {response.verdict.would_try ? "Would Try" : "Would Not Try"}
                </Badge>
                <Badge
                  variant={response.verdict.would_pay ? "default" : "secondary"}
                  className="text-[9px]"
                >
                  {response.verdict.would_pay ? "Would Pay" : "Would Not Pay"}
                </Badge>
              </div>
            </CardContent>
          </div>

          {/* Decision Trace Toggle */}
          {decisionTrace && (
            <div className="border-t border-border/40">
              <Button
                variant="ghost"
                size="sm"
                className="w-full h-8 text-xs gap-1 rounded-none"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsTraceExpanded(!isTraceExpanded);
                }}
              >
                <Brain className="h-3 w-3" />
                Decision Trace
                {isTraceExpanded ? (
                  <ChevronUp className="h-3 w-3" />
                ) : (
                  <ChevronDown className="h-3 w-3" />
                )}
              </Button>

              <AnimatePresence>
                {isTraceExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="p-3 space-y-3 text-xs bg-muted/20">
                      {/* Persona Factors */}
                      {decisionTrace.persona_factors_used.length > 0 && (
                        <div>
                          <div className="font-semibold mb-1 flex items-center gap-1">
                            <Brain className="h-3 w-3" />
                            Persona Factors
                          </div>
                          <div className="space-y-1">
                            {decisionTrace.persona_factors_used
                              .slice(0, 3)
                              .map((f, i) => (
                                <div
                                  key={i}
                                  className={clsx(
                                    "px-2 py-1 rounded text-[10px]",
                                    getEffectColor(f.effect)
                                  )}
                                >
                                  <span className="font-medium">{f.factor}:</span>{" "}
                                  {f.note}
                                </div>
                              ))}
                          </div>
                        </div>
                      )}

                      {/* Top Objections */}
                      {decisionTrace.top_objections.length > 0 && (
                        <div>
                          <div className="font-semibold mb-1 flex items-center gap-1 text-red-400">
                            <AlertCircle className="h-3 w-3" />
                            Objections
                          </div>
                          <ul className="space-y-0.5 text-muted-foreground">
                            {decisionTrace.top_objections.slice(0, 2).map((obj, i) => (
                              <li key={i} className="text-[10px]">
                                • {obj}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* What Would Change Mind */}
                      {decisionTrace.what_would_change_my_mind.length > 0 && (
                        <div>
                          <div className="font-semibold mb-1 flex items-center gap-1 text-yellow-400">
                            <Lightbulb className="h-3 w-3" />
                            Would Change Mind
                          </div>
                          <ul className="space-y-0.5 text-muted-foreground">
                            {decisionTrace.what_would_change_my_mind
                              .slice(0, 2)
                              .map((item, i) => (
                                <li key={i} className="text-[10px]">
                                  • {item}
                                </li>
                              ))}
                          </ul>
                        </div>
                      )}

                      {/* Confidence */}
                      <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1 border-t border-border/30">
                        <span>Confidence</span>
                        <span className="font-medium">
                          {(decisionTrace.confidence * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </Card>
      </motion.div>

      <PersonaChatModal
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        persona={persona}
        idea={idea}
        response={response}
      />
    </>
  );
}
