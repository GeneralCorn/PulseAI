"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Users, Target, TrendingUp, Shield, Zap } from "lucide-react";

interface SimulationLoadingProps {
  ideaTitle?: string;
}

export function SimulationLoading({ ideaTitle }: SimulationLoadingProps) {
  const [stage, setStage] = useState(0);

  const stages = [
    { icon: Users, label: "Spawning stakeholder personas", color: "text-blue-600" },
    { icon: Zap, label: "Running war room simulation", color: "text-yellow-600" },
    { icon: Shield, label: "Analyzing risks & vulnerabilities", color: "text-red-600" },
    { icon: Target, label: "Mapping strategic plan", color: "text-green-600" },
    { icon: TrendingUp, label: "Generating intelligence report", color: "text-purple-600" },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setStage((prev) => (prev + 1) % stages.length);
    }, 2000);

    return () => clearInterval(interval);
  }, [stages.length]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex items-center justify-center p-4 overflow-hidden relative">
      {/* Animated background grid */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `linear-gradient(to right, #000000 1px, transparent 1px),
                           linear-gradient(to bottom, #000000 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
        }} />
      </div>

      {/* Floating particles */}
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-primary/20 rounded-full"
          initial={{
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
          }}
          animate={{
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
          }}
          transition={{
            duration: Math.random() * 10 + 10,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      ))}

      <div className="relative z-10 max-w-2xl w-full">
        {/* Main card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white/90 backdrop-blur-xl border border-gray-200 rounded-2xl p-8 shadow-2xl"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <motion.div
              animate={{
                rotate: 360,
                scale: [1, 1.1, 1],
              }}
              transition={{
                rotate: { duration: 3, repeat: Infinity, ease: "linear" },
                scale: { duration: 2, repeat: Infinity, ease: "easeInOut" },
              }}
              className="inline-block mb-4"
            >
              <Sparkles className="h-12 w-12 text-primary" />
            </motion.div>

            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Running Simulation
            </h1>

            {ideaTitle && (
              <p className="text-gray-600 text-sm">
                Analyzing: <span className="text-primary font-medium">{ideaTitle}</span>
              </p>
            )}
          </div>

          {/* Progress stages */}
          <div className="space-y-4 mb-8">
            <AnimatePresence mode="wait">
              {stages.map((stageData, index) => {
                const Icon = stageData.icon;
                const isActive = index === stage;
                const isComplete = index < stage;

                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{
                      opacity: isActive ? 1 : isComplete ? 0.7 : 0.4,
                      x: 0,
                      scale: isActive ? 1.02 : 1,
                    }}
                    className={`flex items-center gap-3 p-3 rounded-lg border ${
                      isActive
                        ? "bg-primary/10 border-primary/30"
                        : isComplete
                        ? "bg-green-500/10 border-green-500/30"
                        : "bg-gray-100/50 border-gray-200"
                    }`}
                  >
                    <div className={`relative ${isActive ? "animate-pulse" : ""}`}>
                      <Icon className={`h-5 w-5 ${
                        isActive ? stageData.color : isComplete ? "text-green-600" : "text-gray-400"
                      }`} />

                      {isActive && (
                        <motion.div
                          className="absolute inset-0 rounded-full bg-current opacity-20"
                          animate={{
                            scale: [1, 1.5, 1],
                            opacity: [0.2, 0, 0.2],
                          }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                          }}
                        />
                      )}
                    </div>

                    <div className="flex-1">
                      <p className={`text-sm font-medium ${
                        isActive ? "text-gray-900" : isComplete ? "text-green-700" : "text-gray-500"
                      }`}>
                        {stageData.label}
                        {isComplete && " ✓"}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {/* Progress bar */}
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-primary via-blue-500 to-purple-500"
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{
                duration: 10,
                repeat: Infinity,
                ease: "linear",
              }}
            />
          </div>

          {/* Footer message */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="text-center text-gray-600 text-xs mt-6"
          >
            This may take 20-40 seconds. Hang tight...
          </motion.p>
        </motion.div>

        {/* Fun facts or tips */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2 }}
          className="mt-6 text-center"
        >
          <p className="text-gray-700 text-sm italic">
            💡 Tip: The Director Chat can answer questions about any part of your simulation results
          </p>
        </motion.div>
      </div>
    </div>
  );
}
