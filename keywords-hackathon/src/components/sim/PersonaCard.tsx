'use client';

import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Persona, Argument, Idea } from '@/lib/sim/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { clsx } from 'clsx';
import { useState } from 'react';
import { PersonaChatModal } from './PersonaChatModal';
import { MessageSquareText } from 'lucide-react';

interface PersonaCardProps {
  persona: Persona;
  argument: Argument;
  index: number;
  idea: Idea;
}

export function PersonaCard({ persona, argument, index, idea }: PersonaCardProps) {
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Randomize initial position slightly for "swarm" feel
  const randomDelay = Math.random() * 2;
  const randomDuration = 3 + Math.random() * 2;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ 
          opacity: 1, 
          y: [0, -10, 0],
        }}
        transition={{
          y: {
            duration: randomDuration,
            repeat: Infinity,
            ease: "easeInOut",
            delay: randomDelay
          },
          opacity: { duration: 0.5, delay: index * 0.1 }
        }}
        className="w-full max-w-[280px]"
      >
        <Card 
          className="bg-card/40 backdrop-blur-md border-primary/20 hover:border-primary/50 transition-colors cursor-pointer group relative overflow-hidden"
          onClick={() => setIsChatOpen(true)}
        >
           {/* Hover Effect Overlay */}
           <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <div className="bg-background/80 backdrop-blur px-3 py-1 rounded-full border border-primary/20 text-xs font-medium text-primary flex items-center gap-2">
                 <MessageSquareText className="h-3 w-3" />
                 Debate
              </div>
           </div>

          <CardHeader className="pb-2 flex flex-row items-center gap-3 space-y-0">
            <Avatar className="h-10 w-10 border border-border">
              <AvatarImage src={persona.avatarUrl} alt={persona.name} />
              <AvatarFallback>{persona.name[0]}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <CardTitle className="text-sm font-semibold">{persona.name}</CardTitle>
              <span className="text-xs text-muted-foreground">{persona.role}</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-1 mb-3">
              {persona.tags.slice(0, 2).map(tag => (
                <Badge key={tag} variant="outline" className="text-[10px] h-5 px-1.5 border-primary/20 text-primary/80">
                  {tag}
                </Badge>
              ))}
            </div>
            
            <div className={clsx(
              "text-xs font-medium px-2 py-1 rounded-md w-fit mb-2",
              argument.stance === 'support' && "bg-green-500/10 text-green-500 border border-green-500/20",
              argument.stance === 'oppose' && "bg-red-500/10 text-red-500 border border-red-500/20",
              argument.stance === 'neutral' && "bg-yellow-500/10 text-yellow-500 border border-yellow-500/20",
            )}>
              {argument.stance.toUpperCase()}
            </div>
            
            <p className="text-xs text-muted-foreground line-clamp-3 italic">
              "{argument.thoughtProcess}"
            </p>
          </CardContent>
        </Card>
      </motion.div>

      <PersonaChatModal 
        isOpen={isChatOpen} 
        onClose={() => setIsChatOpen(false)} 
        persona={persona} 
        idea={idea} 
      />
    </>
  );
}
