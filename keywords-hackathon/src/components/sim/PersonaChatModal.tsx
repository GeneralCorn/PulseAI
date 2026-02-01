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
import { MessageSquareText, Send } from "lucide-react";
import { useEffect, useRef } from "react";

interface PersonaChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  persona: Persona;
  idea: Idea;
  argument?: { thoughtProcess: string; stance: string };
}

export function PersonaChatModal({
  isOpen,
  onClose,
  persona,
  idea,
  argument,
}: PersonaChatModalProps) {
  const chatHelpers = useChat({
    id: "persona-" + persona.id,
    // @ts-expect-error - api property exists but is missing in type definition
    api: "/api/chat",
    body: {
      type: "persona",
      persona,
      idea,
      context: argument
        ? `Initial Stance: ${argument.stance}. Thought Process: ${argument.thoughtProcess}`
        : "",
    },
    onError: (err) => {
      console.error("Chat error:", err);
      // Prevent modal from closing on error
    },
  }) as any; // eslint-disable-line @typescript-eslint/no-explicit-any

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    append,
    setInput,
    isLoading,
    error,
  } = chatHelpers || ({} as any); // eslint-disable-line @typescript-eslint/no-explicit-any

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const safeInput = input || "";
    if (!safeInput.trim()) return;

    if (handleSubmit) {
      handleSubmit(e);
    } else if (append) {
      append({ role: "user", content: safeInput });
      if (setInput) setInput("");
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        // Only close if explicitly requested and not loading
        if (!open && !isLoading) {
          onClose();
        }
      }}
    >
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] flex flex-col bg-zinc-950/95 backdrop-blur-xl border-zinc-800 text-zinc-100 shadow-2xl">
        <DialogHeader className="border-b border-zinc-800 pb-4 shrink-0 max-h-[40vh] overflow-y-auto">
          <DialogTitle className="flex items-center gap-3">
            <Avatar className="h-10 w-10 border border-zinc-700">
              <AvatarImage src={persona.avatarUrl} className="object-cover" />
              <AvatarFallback>{persona.name[0]}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col gap-1">
              <span>{persona.name}</span>
              <span className="text-xs font-normal text-muted-foreground">
                {persona.role}
              </span>
            </div>
          </DialogTitle>
          <DialogDescription className="mt-2 space-y-4">
            <div className="p-3 bg-zinc-900 rounded-md border border-zinc-800 space-y-2">
              <div>
                <span className="text-xs font-semibold text-zinc-300 block mb-1">
                  Backstory
                </span>
                <p className="text-xs text-zinc-400 italic leading-relaxed break-words">
                  &ldquo;{persona.backstory}&rdquo;
                </p>
              </div>
              <div className="pt-2 border-t border-zinc-800">
                <span className="text-xs font-semibold text-zinc-300 block mb-1">
                  Initial Thoughts
                </span>
                <p className="text-xs text-zinc-400 leading-relaxed break-words">
                  {argument?.thoughtProcess || "Thinking..."}
                </p>
              </div>
            </div>
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 min-h-0 pr-4">
          <div className="flex flex-col gap-4 py-4">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-xs p-3 rounded-lg">
                Error:{" "}
                {error.message ||
                  "Failed to connect to AI service. Please check your API configuration."}
              </div>
            )}
            {messages.length === 0 && !error && (
              <div className="flex flex-col items-center justify-center h-full mt-20 gap-2 text-muted-foreground opacity-50">
                <MessageSquareText className="h-8 w-8" />
                <p className="text-sm italic">
                  Start a conversation about &quot;{idea.title}&quot; with {persona.name}
                </p>
              </div>
            )}
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {messages.map((m: any) => (
              <div
                key={m.id}
                className={`flex gap-3 ${
                  m.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {m.role === "assistant" && (
                  <Avatar className="h-8 w-8 shrink-0 mt-1 border border-zinc-800">
                    <AvatarImage src={persona.avatarUrl} />
                    <AvatarFallback>{persona.name[0]}</AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={`rounded-2xl px-4 py-2.5 text-sm max-w-[85%] shadow-sm ${
                    m.role === "user"
                      ? "bg-primary text-primary-foreground rounded-br-sm"
                      : "bg-zinc-800 text-zinc-100 rounded-bl-sm"
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-3 justify-start">
                <Avatar className="h-8 w-8 shrink-0 mt-1 border border-zinc-800">
                  <AvatarImage src={persona.avatarUrl} />
                  <AvatarFallback>{persona.name[0]}</AvatarFallback>
                </Avatar>
                <div className="bg-zinc-800 text-zinc-100 rounded-2xl rounded-bl-sm px-4 py-3 text-sm flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                  <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                  <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce"></span>
                </div>
              </div>
            )}
            <div ref={scrollRef} />
          </div>
        </ScrollArea>

        <DialogFooter className="border-t border-zinc-800 pt-4 shrink-0">
          <form onSubmit={onSubmit} className="flex w-full items-center gap-2">
            <Input
              value={input || ""}
              onChange={handleInputChange}
              placeholder="Type your message..."
              className="bg-zinc-900/50 border-zinc-700 text-zinc-100 placeholder:text-zinc-500 focus-visible:ring-primary h-11"
              disabled={isLoading}
            />
            <Button
              type="submit"
              size="icon"
              disabled={isLoading || !input?.trim()}
              className="h-11 w-11 shrink-0"
            >
              <Send className="h-5 w-5" />
            </Button>
          </form>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
