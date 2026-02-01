"use client";

import { motion } from "framer-motion";

export function LandingBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-background">
      {/* Subtle Gradient Mesh */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.15),rgba(255,255,255,0))]" />

      {/* Liquid Bubbles - Slow floating like underwater */}
      {/* Large bubble - left side - starts visible */}
      <motion.div
        animate={{
          y: [400, -600],
          x: [0, 30, -20, 15, 0],
          scale: [1, 1.08, 1.04, 1],
        }}
        transition={{
          duration: 45,
          repeat: Infinity,
          ease: "easeInOut",
          times: [0, 0.3, 0.7, 1],
        }}
        className="absolute bottom-0 left-[10%] h-[600px] w-[600px] rounded-full bg-gradient-to-br from-blue-400/70 to-cyan-400/70 blur-[140px] opacity-50"
      />

      {/* Medium bubble - center - starts visible */}
      <motion.div
        animate={{
          y: [200, -800],
          x: [0, -25, 35, -15, 0],
          scale: [1, 1.06, 1.1, 1.03, 1],
        }}
        transition={{
          duration: 50,
          repeat: Infinity,
          ease: "easeInOut",
          times: [0, 0.25, 0.5, 0.75, 1],
          delay: 3,
        }}
        className="absolute bottom-0 left-[45%] h-[500px] w-[500px] rounded-full bg-gradient-to-br from-purple-400/65 to-pink-400/65 blur-[130px] opacity-45"
      />

      {/* Large bubble - right side - starts visible */}
      <motion.div
        animate={{
          y: [300, -700],
          x: [0, -35, 25, -20, 0],
          scale: [1, 1.07, 1.05, 1],
        }}
        transition={{
          duration: 48,
          repeat: Infinity,
          ease: "easeInOut",
          times: [0, 0.3, 0.7, 1],
          delay: 6,
        }}
        className="absolute bottom-0 right-[15%] h-[580px] w-[580px] rounded-full bg-gradient-to-br from-teal-400/70 to-green-400/70 blur-[135px] opacity-48"
      />

      {/* Small bubble - left center */}
      <motion.div
        animate={{
          y: [500, -500],
          x: [0, 20, -15, 10, 0],
          scale: [1, 1.05, 1.08, 1.02, 1],
        }}
        transition={{
          duration: 55,
          repeat: Infinity,
          ease: "easeInOut",
          times: [0, 0.25, 0.5, 0.75, 1],
          delay: 10,
        }}
        className="absolute bottom-0 left-[28%] h-[450px] w-[450px] rounded-full bg-gradient-to-br from-cyan-400/60 to-blue-400/60 blur-[120px] opacity-42"
      />

      {/* Small bubble - right center */}
      <motion.div
        animate={{
          y: [350, -650],
          x: [0, -18, 22, -12, 0],
          scale: [1, 1.06, 1.09, 1.03, 1],
        }}
        transition={{
          duration: 52,
          repeat: Infinity,
          ease: "easeInOut",
          times: [0, 0.25, 0.5, 0.75, 1],
          delay: 14,
        }}
        className="absolute bottom-0 right-[35%] h-[460px] w-[460px] rounded-full bg-gradient-to-br from-indigo-400/63 to-purple-400/63 blur-[125px] opacity-44"
      />

      {/* Ambient glow - static */}
      <motion.div
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.3, 0.4, 0.3],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute top-[20%] left-[35%] h-[400px] w-[400px] rounded-full bg-gradient-to-br from-blue-300/50 to-purple-300/50 blur-[110px]"
      />
    </div>
  );
}
