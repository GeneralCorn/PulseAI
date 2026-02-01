"use client";

import { useChat } from "@ai-sdk/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare, X, Send, Sparkles } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface DirectorChatProps {
  context: string;
  variant?: "floating" | "embedded";
}

export function DirectorChat({
  context,
  variant = "floating",
}: DirectorChatProps) {
  const [isOpen, setIsOpen] = useState(variant === "embedded"); // Embedded is always open
  // Use type assertion to handle the SDK version differences
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const chatHelpers = useChat({
    id: "director",
    // @ts-expect-error - api property exists but is missing in type definition
    api: "/api/chat",
    body: {
      type: "director",
      context,
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onError: (err: any) => {
      console.error("Director chat error:", err);
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

  // Trigger initial greeting when opened
  useEffect(() => {
    // For embedded, it's always open, so this runs on mount.
    // For floating, it runs when isOpen becomes true.
    if (isOpen && messages.length === 0 && !isLoading && append) {
      append({
        role: "system",
        content:
          "Analyze the provided context and introduce yourself as the Director (GPT-5.2). Briefly summarize the current situation and ask the user for their input on the simulation results or next steps. Keep it professional and concise.",
      });
    }
  }, [isOpen, append, isLoading]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    if (handleSubmit) {
      handleSubmit(e);
    } else if (append) {
      // Fallback if handleSubmit is missing
      append({ role: "user", content: input });
      if (setInput) setInput("");
    }
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  if (variant === "embedded") {
    return (
      <div className="flex flex-col h-full w-full bg-card/50 backdrop-blur-xl border border-border/50 rounded-xl overflow-hidden shadow-sm">
        {/* Header */}
        <div className="p-4 border-b border-border/50 bg-primary/5 flex items-center gap-3 shrink-0">
          <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">Director (GPT 5.2)</h3>
            <p className="text-xs text-muted-foreground">Orchestrator Mode</p>
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-xs p-3 rounded-lg">
                Error:{" "}
                {error.message ||
                  "Failed to connect to AI service. Please check your API configuration."}
              </div>
            )}
            {messages.length === 0 && !error && (
              <div className="text-center text-xs text-muted-foreground mt-20">
                <p className="animate-pulse">
                  Director is analyzing the simulation...
                </p>
              </div>
            )}
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {messages.map((m: any) => (
              <div
                key={m.id}
                className={`flex gap-2 ${
                  m.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {m.role === "assistant" && (
                  <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-1">
                    <Sparkles className="h-3 w-3 text-primary" />
                  </div>
                )}
                <div
                  className={`rounded-lg px-3 py-2 text-sm max-w-[85%] ${
                    m.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground"
                  }`}
                >
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {(m as any).content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-2 justify-start">
                <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-1">
                  <Sparkles className="h-3 w-3 text-primary" />
                </div>
                <div className="bg-muted text-foreground rounded-lg px-3 py-2 text-sm animate-pulse">
                  Thinking...
                </div>
              </div>
            )}
            <div ref={scrollRef} />
          </div>
        </ScrollArea>

        {/* Input */}
        <div className="p-3 border-t border-border/50 bg-background/50 shrink-0">
          <form onSubmit={onSubmit} className="flex gap-2">
            <Input
              value={input}
              onChange={handleInputChange}
              placeholder="Ask the Director..."
              className="bg-background border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-primary h-10"
            />
            <Button
              type="submit"
              size="icon"
              disabled={isLoading}
              className="h-10 w-10 shrink-0"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Floating Trigger Button */}
      <motion.div
        className="fixed bottom-6 right-6 z-50"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 1 }}
      >
        <Button
          onClick={() => setIsOpen(!isOpen)}
          size="lg"
          className="rounded-full h-14 w-14 shadow-lg shadow-primary/25 bg-primary hover:bg-primary/90"
        >
          {isOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <MessageSquare className="h-6 w-6" />
          )}
        </Button>
      </motion.div>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 right-6 z-50 w-[350px] md:w-[400px] h-[500px] bg-zinc-950/90 backdrop-blur-xl border border-primary/20 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 border-b border-primary/10 bg-primary/5 flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Director (GPT 5.2)</h3>
                <p className="text-xs text-muted-foreground">
                  Orchestrator Mode
                </p>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {error && (
                  <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-xs p-3 rounded-lg">
                    Error:{" "}
                    {error.message ||
                      "Failed to connect to AI service. Please check your API configuration."}
                  </div>
                )}
                {messages.length === 0 && !error && (
                  <div className="text-center text-xs text-muted-foreground mt-20">
                    <p className="animate-pulse">
                      Director is analyzing the simulation...
                    </p>
                  </div>
                )}
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {messages.map((m: any) => (
                  <div
                    key={m.id}
                    className={`flex gap-2 ${
                      m.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    {m.role === "assistant" && (
                      <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-1">
                        <Sparkles className="h-3 w-3 text-primary" />
                      </div>
                    )}
                    <div
                      className={`rounded-lg px-3 py-2 text-sm max-w-[85%] ${
                        m.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-zinc-800 text-zinc-100"
                      }`}
                    >
                      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                      {(m as any).content}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex gap-2 justify-start">
                    <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-1">
                      <Sparkles className="h-3 w-3 text-primary" />
                    </div>
                    <div className="bg-zinc-800 text-zinc-100 rounded-lg px-3 py-2 text-sm animate-pulse">
                      Thinking...
                    </div>
                  </div>
                )}
                <div ref={scrollRef} />
              </div>
            </ScrollArea>

            {/* Input */}
            <div className="p-3 border-t border-primary/10 bg-zinc-900/50">
              <form onSubmit={onSubmit} className="flex gap-2">
                <Input
                  value={input}
                  onChange={handleInputChange}
                  placeholder="Ask the Director..."
                  className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-400 focus-visible:ring-primary h-10"
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={isLoading}
                  className="h-10 w-10 shrink-0"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
