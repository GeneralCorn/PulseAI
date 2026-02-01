"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MessageSquare, X, Send, Sparkles, ChevronDown } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

// Director model options
type DirectorModel = "auto" | "gpt-5" | "gpt-4o" | "gpt-5.2" | "claude-sonnet-4-5-20250514";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface DirectorChatProps {
  context: string;
  simulationId?: string;
  variant?: "floating" | "embedded";
  disabled?: boolean;
}

export function DirectorChat({
  context,
  simulationId,
  variant = "floating",
  disabled = false,
}: DirectorChatProps) {
  const [isOpen, setIsOpen] = useState(variant === "embedded");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<DirectorModel>("auto");
  const [mounted, setMounted] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!input.trim() || isLoading || disabled) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: input,
    };

    const assistantMessageId = crypto.randomUUID();

    // Add both user message and empty assistant message immediately
    setMessages((prev) => [
      ...prev,
      userMessage,
      {
        id: assistantMessageId,
        role: "assistant",
        content: "",
      },
    ]);
    setInput("");
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
          type: "director",
          context,
          simulationId,
          selectedModel,
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error("No response body");
      }

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
      setError(err instanceof Error ? err.message : "Failed to send message");
      // Remove the empty assistant message on error
      setMessages((prev) => prev.filter((m) => m.id !== assistantMessageId));
    } finally {
      setIsLoading(false);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      const form = e.currentTarget.closest("form");
      if (form) {
        form.requestSubmit();
      }
    }
  };

  if (variant === "embedded") {
    return (
      <div className={`flex flex-col h-full w-full bg-card/50 backdrop-blur-xl border border-border/50 rounded-xl overflow-hidden shadow-sm relative ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
        {/* Header */}
        <div className="p-4 border-b border-border/50 bg-primary/5 flex items-center gap-3 shrink-0">
          <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-sm">Director</h3>
            <p className="text-xs text-muted-foreground">Orchestrator Mode</p>
          </div>
          {mounted && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">
                  {selectedModel === "auto" ? "Auto" :
                   selectedModel === "gpt-5" ? "GPT-5" :
                   selectedModel === "gpt-4o" ? "GPT-4o" :
                   selectedModel === "gpt-5.2" ? "GPT-5.2" :
                   selectedModel === "claude-sonnet-4-5-20250514" ? "Claude" : "Auto"}
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setSelectedModel("auto")}>
                  <span className="font-medium">Auto</span>
                  <span className="text-xs text-muted-foreground ml-2">(Recommended)</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSelectedModel("gpt-5")}>
                  GPT-5
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSelectedModel("gpt-4o")}>
                  GPT-4o
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSelectedModel("gpt-5.2")}>
                  GPT-5.2
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSelectedModel("claude-sonnet-4-5-20250514")}>
                  Claude Sonnet 4.5
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 p-4 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <div className="space-y-4">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-xs p-3 rounded-lg">
                Error: {error}
              </div>
            )}
            {disabled && (
              <div className="text-center text-sm text-muted-foreground mt-20 px-4">
                <Sparkles className="h-8 w-8 text-muted-foreground mx-auto mb-3 opacity-30 animate-pulse" />
                <p className="font-medium mb-2">Analyzing Simulation...</p>
                <p className="text-xs">
                  Director will be ready once the intelligence report is complete.
                </p>
              </div>
            )}
            {!disabled && messages.length === 0 && !error && (
              <div className="text-center text-sm text-muted-foreground mt-20 px-4">
                <Sparkles className="h-8 w-8 text-primary mx-auto mb-3 opacity-50" />
                <p className="font-medium mb-2">Director Ready</p>
                <p className="text-xs">
                  Ask me about the simulation results, risks, or strategic recommendations.
                </p>
              </div>
            )}
            {messages.map((m) => (
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
                  } ${m.role === "assistant" && !m.content && isLoading ? "animate-pulse" : ""}`}
                >
                  {m.role === "assistant" && !m.content && isLoading ? "Thinking..." : m.content}
                </div>
              </div>
            ))}
            <div ref={scrollRef} />
          </div>
        </div>

        {/* Input */}
        <div className="p-3 border-t border-border/50 bg-background/50 shrink-0">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder={disabled ? "Analyzing simulation..." : "Ask the Director..."}
              className="bg-background border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-primary h-10"
              disabled={isLoading || disabled}
            />
            <Button
              type="submit"
              size="icon"
              disabled={isLoading || disabled}
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
                <h3 className="font-semibold text-sm">Director</h3>
                <p className="text-xs text-muted-foreground">
                  Orchestrator Mode
                </p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 p-4 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              <div className="space-y-4">
                {error && (
                  <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-xs p-3 rounded-lg">
                    Error: {error}
                  </div>
                )}
                {messages.length === 0 && !error && (
                  <div className="text-center text-sm text-muted-foreground mt-20 px-4">
                    <Sparkles className="h-8 w-8 text-primary mx-auto mb-3 opacity-50" />
                    <p className="font-medium mb-2">Director Ready</p>
                    <p className="text-xs">
                      Ask me about the simulation results, risks, or strategic recommendations.
                    </p>
                  </div>
                )}
                {messages.map((m) => (
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
                      } ${m.role === "assistant" && !m.content && isLoading ? "animate-pulse" : ""}`}
                    >
                      {m.role === "assistant" && !m.content && isLoading ? "Thinking..." : m.content}
                    </div>
                  </div>
                ))}
                <div ref={scrollRef} />
              </div>
            </div>

            {/* Input */}
            <div className="p-3 border-t border-primary/10 bg-zinc-900/50">
              <form onSubmit={handleSubmit} className="flex gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={onKeyDown}
                  placeholder="Ask the Director..."
                  className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-400 focus-visible:ring-primary h-10"
                  disabled={isLoading}
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
