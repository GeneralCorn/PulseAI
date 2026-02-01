"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { startSimulation } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { LandingBackground } from "@/components/landing/LandingBackground";
import { Header } from "@/components/landing/Header";
import { motion, AnimatePresence } from "framer-motion";

import { SimulationView } from "@/components/sim/SimulationView";
import { SimulationResult } from "@/lib/sim/types";

export default function LandingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [isCompareMode, setIsCompareMode] = useState(false);
  const [simulationResult, setSimulationResult] =
    useState<SimulationResult | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    const formData = new FormData(event.currentTarget);
    // Always use war_room mode
    formData.append("mode", "war_room");
    // Append compare mode flag
    formData.append("is_compare", isCompareMode ? "true" : "false");

    const result = await startSimulation(formData);

    if (result.success) {
      if (result.redirectUrl) {
        router.push(result.redirectUrl);
      } else if (result.result) {
        // Fallback for when DB is missing
        setSimulationResult(result.result);
        setLoading(false);
      }
    } else {
      console.error(result.error);
      setLoading(false);
      alert(result.error || "Simulation failed");
    }
  };

  if (simulationResult) {
    return (
      <SimulationView
        result={simulationResult}
        onBack={() => setSimulationResult(null)}
        isReadOnly={true}
      />
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col">
      <LandingBackground />
      <Header />

      <main className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 pt-24 md:pt-32">
        <div className="w-full max-w-5xl flex flex-col items-center space-y-8">
          {/* Hero Section */}
          <div className="text-center space-y-4 max-w-2xl mx-auto">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl md:text-6xl font-bold tracking-tight text-foreground"
            >
              Simulate the Future.
              <span className="block text-primary bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-500">
                Before You Build It.
              </span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-lg text-muted-foreground"
            >
              Pressure-test your ideas with an AI stakeholder swarm. Identify
              risks, refine strategies, and predict reactions instantly.
            </motion.p>
          </div>

          {/* Input Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className={`w-full transition-all duration-500 ease-in-out ${isCompareMode ? "max-w-5xl" : "max-w-2xl"}`}
          >
            <div className="bg-background/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6 md:p-8 shadow-2xl ring-1 ring-white/10">
                <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                    Simulation Engine Ready
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 bg-background/50 rounded-full px-4 py-1.5 border border-border/50">
                    <Label
                      htmlFor="sample-count"
                      className="text-xs font-medium cursor-pointer select-none whitespace-nowrap"
                    >
                      Personas
                    </Label>
                    <Input
                      id="sample-count"
                      name="sample_count"
                      type="number"
                      min={1}
                      max={100}
                      defaultValue={10}
                      className="w-16 h-7 text-center bg-transparent border-0 focus:ring-0 text-sm font-medium p-0"
                    />
                  </div>
                  <div className="flex items-center gap-3 bg-background/50 rounded-full px-4 py-1.5 border border-border/50">
                    <Label
                      htmlFor="compare-mode"
                      className="text-xs font-medium cursor-pointer select-none"
                    >
                      A/B Comparison
                    </Label>
                    <Switch
                      id="compare-mode"
                      checked={isCompareMode}
                      onCheckedChange={setIsCompareMode}
                    />
                  </div>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-8">
                <div
                  className={`grid gap-8 transition-all duration-500 ${isCompareMode ? "md:grid-cols-2" : "grid-cols-1"}`}
                >
                  {/* Idea A */}
                  <div className="space-y-5">
                    {isCompareMode && (
                      <div className="flex items-center gap-2 text-primary font-semibold pb-2 border-b border-border/50">
                        <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center text-xs border border-primary/30">
                          A
                        </div>
                        <span>Option A</span>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label
                        htmlFor="title"
                        className="text-sm font-medium text-muted-foreground ml-1"
                      >
                        Title
                      </Label>
                      <Input
                        id="title"
                        name="title"
                        placeholder="e.g., AI-Powered HR Assistant"
                        defaultValue="GreenProof"
                        required
                        className="bg-background/50 border-white/10 focus:border-primary/50 focus:ring-primary/20 h-12 text-lg placeholder:text-muted-foreground/50"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="description"
                        className="text-sm font-medium text-muted-foreground ml-1"
                      >
                        Brief
                      </Label>
                      <Textarea
                        id="description"
                        name="description"
                        placeholder="Describe your idea, goals, and target audience..."
                        defaultValue="A B2B supply-chain verification platform that uses computer vision and IoT sensors to track raw materials in real-time. It provides brands with a 'Live Sustainability Score' they can embed on product pages, proving that their 'organic' or 'recycled' claims aren't just greenwashing by showing the actual path from source to shelf."
                        className="min-h-[160px] bg-background/50 border-white/10 focus:border-primary/50 focus:ring-primary/20 resize-none text-base placeholder:text-muted-foreground/50"
                        required
                      />
                    </div>
                  </div>

                  {/* Idea B */}
                  <AnimatePresence>
                    {isCompareMode && (
                      <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20, width: 0 }}
                        className="space-y-5"
                      >
                        <div className="flex items-center gap-2 text-primary font-semibold pb-2 border-b border-border/50">
                          <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center text-xs border border-primary/30">
                            B
                          </div>
                          <span>Option B</span>
                        </div>

                        <div className="space-y-2">
                          <Label
                            htmlFor="title_b"
                            className="text-sm font-medium text-muted-foreground ml-1"
                          >
                            Title
                          </Label>
                          <Input
                            id="title_b"
                            name="title_b"
                            placeholder="e.g., Human-Centric HR Policy"
                            required
                            className="bg-background/50 border-white/10 focus:border-primary/50 focus:ring-primary/20 h-12 text-lg placeholder:text-muted-foreground/50"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label
                            htmlFor="description_b"
                            className="text-sm font-medium text-muted-foreground ml-1"
                          >
                            Brief
                          </Label>
                          <Textarea
                            id="description_b"
                            name="description_b"
                            placeholder="Describe the alternative idea..."
                            className="min-h-[160px] bg-background/50 border-white/10 focus:border-primary/50 focus:ring-primary/20 resize-none text-base placeholder:text-muted-foreground/50"
                            required
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <Button
                  type="submit"
                  className="w-full h-14 text-lg font-medium bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
                  disabled={loading}
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Running Simulation...
                    </div>
                  ) : (
                    "Run Simulation"
                  )}
                </Button>
              </form>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
