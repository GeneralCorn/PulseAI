"use client";

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
import { Persona, PersonaResponse, Idea } from "@/lib/sim/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageSquareText, Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface PersonaChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  persona: Persona;
  idea: Idea;
  response?: PersonaResponse;
}

// Helper to generate avatar URL from name
function getAvatarUrl(name: string): string {
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`;
}

// Helper to derive stance from scores
function getStance(response?: PersonaResponse): string {
  if (!response) return "thinking";
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

export function PersonaChatModal({
  isOpen,
  onClose,
  persona,
  idea,
  response,
}: PersonaChatModalProps) {
  const name = persona.demographics.name;
  const occupation = persona.demographics.occupation || "Consumer";
  const avatarUrl = getAvatarUrl(name);
  const stance = getStance(response);

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Reset messages when modal opens with a different persona
  useEffect(() => {
    if (isOpen) {
      setMessages([]);
      setError(null);
    }
  }, [isOpen, persona.persona_id]);

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: input,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    setError(null);

    try {
      const chatResponse = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
          type: "persona",
          persona: {
            name,
            occupation,
            profile: persona.profile,
          },
          idea,
          context: response
            ? `Initial Stance: ${stance}. Response: ${response.free_text}`
            : "",
        }),
      });

      if (!chatResponse.ok) {
        throw new Error(`API error: ${chatResponse.status}`);
      }

      const reader = chatResponse.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error("No response body");
      }

      const assistantMessageId = crypto.randomUUID();

      setMessages((prev) => [
        ...prev,
        {
          id: assistantMessageId,
          role: "assistant",
          content: "",
        },
      ]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value, { stream: true });

        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMessageId
              ? { ...m, content: m.content + text }
              : m
          )
        );
      }
    } catch (err) {
      console.error("Chat error:", err);
      setError(err instanceof Error ? err : new Error("Failed to send message"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open && !isLoading) {
          onClose();
        }
      }}
    >
      <DialogContent className="sm:max-w-[500px] h-[85vh] grid! grid-rows-[auto_1fr_auto]! bg-zinc-950/95 backdrop-blur-xl border-zinc-800 text-zinc-100 shadow-2xl overflow-hidden gap-0">
        <DialogHeader className="border-b border-zinc-800 pb-4 shrink-0 max-h-[30vh] overflow-y-auto">
          <DialogTitle className="flex items-center gap-3">
            <Avatar className="h-10 w-10 border border-zinc-700">
              <AvatarImage src={avatarUrl} className="object-cover" />
              <AvatarFallback>{name[0]}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col gap-1">
              <span>{name}</span>
              <span className="text-xs font-normal text-muted-foreground">
                {occupation}
              </span>
            </div>
          </DialogTitle>
          <DialogDescription asChild>
            <div className="mt-2 space-y-4 text-muted-foreground text-sm">
              <div className="p-3 bg-zinc-900 rounded-md border border-zinc-800 space-y-2">
                <div>
                  <span className="text-xs font-semibold text-zinc-300 block mb-1">
                    Profile
                  </span>
                  <span className="text-xs text-zinc-400 italic leading-relaxed break-words block">
                    &ldquo;{persona.profile.one_liner}&rdquo;
                  </span>
                </div>
                {persona.profile.pain_points.length > 0 && (
                  <div className="pt-2 border-t border-zinc-800">
                    <span className="text-xs font-semibold text-zinc-300 block mb-1">
                      Pain Points
                    </span>
                    <ul className="text-xs text-zinc-400 space-y-0.5">
                      {persona.profile.pain_points.slice(0, 3).map((point, i) => (
                        <li key={i}>• {point}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {response && (
                  <div className="pt-2 border-t border-zinc-800">
                    <span className="text-xs font-semibold text-zinc-300 block mb-1">
                      Initial Response
                    </span>
                    <span className="text-xs text-zinc-400 leading-relaxed break-words block">
                      {response.free_text || "Thinking..."}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-full min-h-0 overflow-hidden px-1">
          <div className="flex flex-col gap-4 py-4 pr-3">
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
                  Start a conversation about &quot;{idea.title}&quot; with {name}
                </p>
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
                  <Avatar className="h-8 w-8 shrink-0 mt-1 border border-zinc-800">
                    <AvatarImage src={avatarUrl} />
                    <AvatarFallback>{name[0]}</AvatarFallback>
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
                  <AvatarImage src={avatarUrl} />
                  <AvatarFallback>{name[0]}</AvatarFallback>
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
              value={input}
              onChange={onInputChange}
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
