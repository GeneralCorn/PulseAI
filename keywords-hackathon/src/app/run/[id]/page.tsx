import { supabase } from "@/lib/supabase";
import { notFound } from "next/navigation";
import { SimulationResult } from "@/lib/sim/types";
import { SimulationView } from "@/components/sim/SimulationView";

interface RunPageProps {
  params: Promise<{ id: string }>;
}

export default async function RunPage({ params }: RunPageProps) {
  const { id } = await params;

  const { data, error } = await supabase
    .from("simulations")
    .select("result_json")
    .eq("id", id)
    .single();

  if (error || !data) {
    notFound();
  }

  const result = JSON.parse(data.result_json) as SimulationResult;

  return <SimulationView result={result} />;
}
