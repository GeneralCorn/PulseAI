"use client";

import {
  ReactFlow,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  Node,
  Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { SimulationResult } from "@/lib/sim/types";
import { useEffect } from "react";

interface DecisionTreeProps {
  result: SimulationResult;
}

export function DecisionTree({ result }: DecisionTreeProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  useEffect(() => {
    // Construct graph from result
    // Root: Idea
    const rootId = "root";
    const newNodes: Node[] = [
      {
        id: rootId,
        type: "input",
        data: { label: result.ideas[0].title },
        position: { x: 250, y: 0 },
        className:
          "bg-primary/20 border-primary text-primary-foreground font-bold rounded-lg",
      },
    ];

    const newEdges: Edge[] = [];
    let yOffset = 100;

    // Level 1: Key Risks
    result.risks.slice(0, 3).forEach((risk, i) => {
      const id = `risk-${i}`;
      newNodes.push({
        id,
        data: { label: `${risk.type} Risk` },
        position: { x: 100 + i * 200, y: yOffset },
        className:
          "bg-destructive/10 border-destructive text-destructive rounded",
      });
      newEdges.push({
        id: `e-${rootId}-${id}`,
        source: rootId,
        target: id,
        animated: true,
      });
    });

    yOffset += 100;

    // Level 2: Mitigation/Plan
    result.plan.forEach((step, i) => {
      const id = `plan-${i}`;
      newNodes.push({
        id,
        data: { label: step.title },
        position: { x: 100 + i * 200, y: yOffset },
        className: "bg-green-500/10 border-green-500 text-green-500 rounded",
      });
      // Connect to nearest risk roughly (mock logic for viz)
      const targetRiskIndex = i % Math.min(result.risks.length, 3);
      newEdges.push({
        id: `e-risk-${targetRiskIndex}-${id}`,
        source: `risk-${targetRiskIndex}`,
        target: id,
        type: "smoothstep",
      });
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
        attributionPosition="bottom-right"
      >
        <Background color="#333" gap={20} size={1} />
        <Controls className="bg-background/80 border-border" />
      </ReactFlow>
    </div>
  );
}
