"use client";

import {
  ReactFlow,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  Node,
  Edge,
  NodeMouseHandler,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { SimulationResult } from "@/lib/sim/types";
import { useEffect, useCallback } from "react";

interface DecisionTreeProps {
  result: SimulationResult;
  
}

export function DecisionTree({ result }: DecisionTreeProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  useEffect(() => {
    // Construct graph from result with enhanced structure and better spacing
    const rootId = "root";

    // Calculate total width needed for proper spacing
    const riskCount = result.risks.length;
    const planCount = result.plan.length;

    // Spacing constants - much larger to prevent overlap
    const HORIZONTAL_SPACING = 400; // Space between plan items
    const VERTICAL_SPACING = 140; // Space between levels
    const OPTION_SPACING = 250; // Space between options
    const NODE_WIDTH = 220; // Approximate node width

    // Calculate center position for root
    const totalWidth = Math.max(riskCount, planCount) * HORIZONTAL_SPACING;
    const centerX = totalWidth / 2;

    const newNodes: Node[] = [
      {
        id: rootId,
        type: "input",
        data: {
          label: result.ideas[0].title,
          nodeType: "idea",
          description: result.ideas[0].description,
        },
        position: { x: centerX - NODE_WIDTH / 2, y: 0 },
        className:
          "bg-blue-500/20 border-2 border-blue-500 text-blue-100 font-bold rounded-lg px-4 py-2 hover:bg-blue-500/30 cursor-pointer transition-colors",
        style: { minWidth: NODE_WIDTH },
      },
    ];

    const newEdges: Edge[] = [];
    let yOffset = VERTICAL_SPACING;

    // Level 1: Key Risks - spread them out evenly
    const riskSpacing = riskCount > 1 ? totalWidth / (riskCount + 1) : centerX;
    result.risks.forEach((risk, i) => {
      const id = risk.id || `risk-${i}`;
      const severityColor =
        risk.severity === "high" || risk.severity === "critical"
          ? "red"
          : risk.severity === "medium"
          ? "orange"
          : "yellow";

      newNodes.push({
        id,
        data: {
          label: risk.title || `${risk.type} Risk`,
          nodeType: "risk",
          chatPrefill: risk.chatPrefill || `Explain the "${risk.title}" risk in detail, including early warning signs and failure modes.`,
          risk,
        },
        position: { x: riskSpacing * (i + 1) - NODE_WIDTH / 2, y: yOffset },
        className: `bg-${severityColor}-500/20 border-2 border-${severityColor}-500 text-${severityColor}-100 rounded-lg px-4 py-2 hover:bg-${severityColor}-500/30 cursor-pointer transition-colors`,
        style: { minWidth: NODE_WIDTH },
      });
      newEdges.push({
        id: `e-${rootId}-${id}`,
        source: rootId,
        target: id,
        animated: true,
        style: { stroke: `rgb(239 68 68 / 0.5)` },
      });
    });

    yOffset += VERTICAL_SPACING;

    // Level 2: Mitigation/Plan - spread based on which risk they connect to
    result.plan.forEach((step, i) => {
      const planId = step.id || `plan-${i}`;

      // Find which risk this connects to for better positioning
      const riskIndex = result.risks.findIndex(r => r.id === step.riskId) ?? i % riskCount;
      const baseX = riskSpacing * (riskIndex + 1);

      // If multiple plans per risk, offset them
      const plansForThisRisk = result.plan.filter(p => {
        const rIdx = result.risks.findIndex(r => r.id === p.riskId);
        return rIdx === riskIndex || (rIdx === -1 && (result.plan.indexOf(p) % riskCount) === riskIndex);
      });
      const offsetIndex = plansForThisRisk.indexOf(step);
      const offsetX = offsetIndex * (HORIZONTAL_SPACING / 3);

      newNodes.push({
        id: planId,
        data: {
          label: step.title,
          nodeType: "plan",
          chatPrefill: step.chatPrefill || `How do I implement "${step.title}"? Provide a checklist, prerequisites, pitfalls, timeline, and success criteria.`,
          plan: step,
        },
        position: { x: baseX - NODE_WIDTH / 2 + offsetX, y: yOffset },
        className: "bg-green-500/20 border-2 border-green-500 text-green-100 rounded-lg px-4 py-2 hover:bg-green-500/30 cursor-pointer transition-colors",
        style: { minWidth: NODE_WIDTH },
      });

      // Connect to the risk it mitigates
      const riskId = step.riskId || result.risks[i % result.risks.length]?.id || `risk-${i % result.risks.length}`;
      newEdges.push({
        id: `e-${riskId}-${planId}`,
        source: riskId,
        target: planId,
        type: "smoothstep",
        style: { stroke: `rgb(34 197 94 / 0.5)` },
      });

      // Level 3: Options for each plan step
      if (step.options && step.options.length > 0) {
        const optionYOffset = yOffset + VERTICAL_SPACING;
        const planX = baseX + offsetX;
        const optionCount = step.options.length;

        // Center options under their plan
        const optionStartX = planX - ((optionCount - 1) * OPTION_SPACING) / 2;

        step.options.forEach((option, optIdx) => {
          const optionId = option.id || `${planId}-opt-${optIdx}`;
          const optionX = optionStartX + optIdx * OPTION_SPACING;

          newNodes.push({
            id: optionId,
            data: {
              label: option.label,
              nodeType: "option",
              chatPrefill: option.chatPrefill || `Explain "${option.label}" option for ${step.title}. When should I choose this and what are the tradeoffs?`,
              option,
            },
            position: { x: optionX - 80, y: optionYOffset },
            className: "bg-purple-500/20 border-2 border-purple-500 text-purple-100 rounded-lg px-3 py-1.5 text-sm hover:bg-purple-500/30 cursor-pointer transition-colors",
            style: { minWidth: 160, fontSize: 12 },
          });

          newEdges.push({
            id: `e-${planId}-${optionId}`,
            source: planId,
            target: optionId,
            type: "smoothstep",
            style: { stroke: `rgb(168 85 247 / 0.5)` },
          });

          // Level 4: Next step or stop
          if (option.nextStep) {
            const nextStepId = option.nextStep.id || `${optionId}-next`;
            newNodes.push({
              id: nextStepId,
              data: {
                label: option.nextStep.title,
                nodeType: "nextStep",
                chatPrefill: option.nextStep.chatPrefill || `What are the concrete next steps for "${option.nextStep.title}"? Provide success criteria.`,
                nextStep: option.nextStep,
              },
              position: { x: optionX - 80, y: optionYOffset + VERTICAL_SPACING },
              className: "bg-cyan-500/20 border-2 border-cyan-500 text-cyan-100 rounded-lg px-3 py-1.5 text-xs hover:bg-cyan-500/30 cursor-pointer transition-colors",
              style: { minWidth: 160, fontSize: 11 },
            });

            newEdges.push({
              id: `e-${optionId}-${nextStepId}`,
              source: optionId,
              target: nextStepId,
              type: "smoothstep",
              animated: true,
              style: { stroke: `rgb(6 182 212 / 0.5)` },
            });
          } else if (option.stop) {
            const stopId = `${optionId}-stop`;
            newNodes.push({
              id: stopId,
              data: {
                label: "Stop",
                nodeType: "stop",
                chatPrefill: `Why is stopping acceptable here? Explain: ${option.stopReason}`,
                stopReason: option.stopReason,
              },
              position: { x: optionX - 60, y: optionYOffset + VERTICAL_SPACING },
              className: "bg-gray-500/20 border-2 border-gray-500 text-gray-300 rounded-lg px-3 py-1.5 text-xs hover:bg-gray-500/30 cursor-pointer transition-colors",
              style: { minWidth: 120, fontSize: 11 },
            });

            newEdges.push({
              id: `e-${optionId}-${stopId}`,
              source: optionId,
              target: stopId,
              type: "smoothstep",
              style: { stroke: `rgb(107 114 128 / 0.5)` },
            });
          }
        });
      }
    });

    setNodes(newNodes);
    setEdges(newEdges);
  }, [result, setNodes, setEdges]);


  return (
    <div className="h-full w-full bg-background/50 rounded-xl border border-border/40 overflow-hidden">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        
        fitView
        fitViewOptions={{
          padding: 0.2,
          includeHiddenNodes: false,
          minZoom: 0.1,
          maxZoom: 1.2,
        }}
        attributionPosition="bottom-right"
        minZoom={0.05}
        maxZoom={2}
        defaultViewport={{ x: 0, y: 0, zoom: 0.5 }}
      >
        <Background color="#333" gap={20} size={1} />
        <Controls className="bg-background/80 border-border" />
      </ReactFlow>
    </div>
  );
}
