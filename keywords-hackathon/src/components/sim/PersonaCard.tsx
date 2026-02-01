"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Persona, Argument, Idea } from "@/lib/sim/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { clsx } from "clsx";
import { useState, useEffect } from "react";
import { PersonaChatModal } from "./PersonaChatModal";
import { MessageSquareText } from "lucide-react";

interface PersonaCardProps {
  persona: Persona;
  argument: Argument;
  index: number;
  idea: Idea;
}

export function PersonaCard({
  persona,
  argument,
  index,
  idea,
}: PersonaCardProps) {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [randomValues, setRandomValues] = useState({ delay: 0, duration: 4 });

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
          y: [0, -5, 0],
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
        <Card
          className="bg-card/40 backdrop-blur-md border-primary/20 hover:border-primary/50 transition-all duration-300 cursor-pointer group relative overflow-hidden h-full flex flex-col"
          onClick={() => setIsChatOpen(true)}
        >
          {/* Hover Effect Overlay */}
          <div className="absolute inset-0 bg-background/60 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 flex items-center justify-center">
            <div className="bg-primary text-primary-foreground px-5 py-2.5 rounded-full shadow-xl transform scale-90 group-hover:scale-100 transition-transform duration-300 flex items-center gap-2 font-medium">
              <MessageSquareText className="h-4 w-4" />
              Discuss
            </div>
          </div>

          <CardHeader className="pb-3 pt-4 px-4 flex flex-row items-start gap-3 space-y-0 border-b border-border/40 bg-muted/10 min-h-[5rem]">
            <Avatar className="h-10 w-10 border border-border shadow-sm shrink-0 mt-1">
              <AvatarImage
                src={persona.avatarUrl}
                alt={persona.name}
                className="object-cover"
              />
              <AvatarFallback>{persona.name[0]}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col min-w-0 justify-center h-full py-0.5">
              <CardTitle className="text-sm font-bold leading-tight">
                {persona.name}
              </CardTitle>
              <span className="text-xs text-muted-foreground mt-0.5">
                {persona.role}
              </span>
            </div>
          </CardHeader>

          <CardContent className="p-4 flex-1 flex flex-col gap-3">
            <div className="flex items-center justify-between gap-2">
              <div
                className={clsx(
                  "text-[10px] font-bold px-2 py-1 rounded-md border tracking-wide uppercase flex items-center justify-center",
                  argument.stance === "support" &&
                    "bg-green-500/10 text-green-500 border-green-500/20",
                  argument.stance === "oppose" &&
                    "bg-red-500/10 text-red-500 border-red-500/20",
                  argument.stance === "neutral" &&
                    "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
                )}
              >
                {argument.stance}
              </div>

              <div className="flex gap-1 flex-wrap justify-end">
                {persona.tags.slice(0, 2).map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="text-[9px] h-5 px-1.5 text-muted-foreground font-normal border-border/50"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="relative pl-3 border-l-2 border-primary/20 mt-1">
              <p className="text-xs text-muted-foreground line-clamp-3 italic leading-relaxed">
                &ldquo;{argument.thoughtProcess}&rdquo;
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <PersonaChatModal
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        persona={persona}
        idea={idea}
        argument={argument}
      />
    </>
  );
}
