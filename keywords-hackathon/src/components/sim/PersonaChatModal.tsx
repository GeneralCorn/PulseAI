"use client";

import { useChat } from "@ai-sdk/react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Persona, Idea } from "@/lib/sim/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, User } from "lucide-react";
import { useEffect, useRef } from "react";

interface PersonaChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  persona: Persona;
  idea: Idea; // To pass context about what they are critiquing
}

export function PersonaChatModal({
  isOpen,
  onClose,
  persona,
  idea,
}: PersonaChatModalProps) {
  // @ts-expect-error - API exists in Vercel AI SDK but TS definitions might be lagging or strict
  const { messages, input, handleInputChange, handleSubmit, isLoading, error } =
    useChat({
      id: "persona-" + persona.id,
      // @ts-expect-error - api property exists but is missing in type definition
      api: "/api/chat",
      body: {
        type: "persona",
        persona,
        idea,
      },
      onError: (err) => {
        console.error("Chat error:", err);
        // Prevent modal from closing on error
      },
    });

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] bg-zinc-950 border-zinc-800 text-zinc-100">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={persona.avatarUrl} />
              <AvatarFallback>{persona.name[0]}</AvatarFallback>
            </Avatar>
            {persona.name}
            <span className="text-xs font-normal text-muted-foreground ml-2">
              {persona.role}
            </span>
          </DialogTitle>
          <DialogDescription>
            Discussing &quot;{idea.title}&quot;. Ask me anything about my
            stance.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[400px] pr-4">
          <div className="flex flex-col gap-4 py-4">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-xs p-3 rounded-lg">
                Error:{" "}
                {error.message ||
                  "Failed to connect to AI service. Please check your API configuration."}
              </div>
            )}
            {messages.length === 0 && !error && (
              <div className="text-center text-sm text-muted-foreground italic mt-10">
                Start a conversation with {persona.name}...
              </div>
            )}
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex gap-3 ${
                  m.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {m.role === "assistant" && (
                  <Avatar className="h-6 w-6 shrink-0 mt-1">
                    <AvatarImage src={persona.avatarUrl} />
                    <AvatarFallback>{persona.name[0]}</AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={`rounded-lg px-3 py-2 text-sm max-w-[80%] ${
                    m.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-zinc-800 text-zinc-100"
                  }`}
                >
                  {m.content}
                </div>
                {m.role === "user" && (
                  <Avatar className="h-6 w-6 shrink-0 mt-1">
                    <AvatarFallback>
                      <User className="h-3 w-3" />
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-3 justify-start">
                <Avatar className="h-6 w-6 shrink-0 mt-1">
                  <AvatarFallback>...</AvatarFallback>
                </Avatar>
                <div className="bg-zinc-800 text-zinc-100 rounded-lg px-3 py-2 text-sm">
                  <span className="animate-pulse">Typing...</span>
                </div>
              </div>
            )}
            <div ref={scrollRef} />
          </div>
        </ScrollArea>

        <DialogFooter>
          <form
            onSubmit={handleSubmit}
            className="flex w-full items-center space-x-2"
          >
            <Input
              value={input}
              onChange={handleInputChange}
              placeholder="Type your message..."
              className="bg-zinc-900 border-zinc-700 focus-visible:ring-primary"
            />
            <Button type="submit" size="icon" disabled={isLoading}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
