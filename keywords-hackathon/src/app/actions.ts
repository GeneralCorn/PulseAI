"use server";

import { runSimulation } from "@/lib/sim/simulator";
import { createClient } from "@/lib/supabase/server";
import { Idea } from "@/lib/sim/types";

export async function startSimulation(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      success: false,
      error: "You must be logged in to run a simulation.",
    };
  }

  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const mode = formData.get("mode") as string;
  const isCompare = formData.get("is_compare") === "true";
  const useMock = mode === "quick";

  try {
    // 1. Create Idea(s) in DB
    const ideas: Idea[] = [];

    // Create Idea A
    const { data: ideaAData, error: ideaAError } = await supabase
      .from("ideas")
      .insert({
        user_id: user.id,
        title,
        description,
      })
      .select()
      .single();

    if (ideaAError) {
      console.error("Failed to create idea A:", ideaAError);
      throw new Error("Failed to create idea A");
    }
    ideas.push({
      id: ideaAData.id,
      title: ideaAData.title,
      description: ideaAData.description,
    });

    // Create Idea B if in compare mode
    if (isCompare) {
      const titleB = formData.get("title_b") as string;
      const descriptionB = formData.get("description_b") as string;

      const { data: ideaBData, error: ideaBError } = await supabase
        .from("ideas")
        .insert({
          user_id: user.id,
          title: titleB,
          description: descriptionB,
        })
        .select()
        .single();

      if (ideaBError) {
        console.error("Failed to create idea B:", ideaBError);
        throw new Error("Failed to create idea B");
      }
      ideas.push({
        id: ideaBData.id,
        title: ideaBData.title,
        description: ideaBData.description,
      });
    }

    // 2. Run Simulation
    const result = await runSimulation(ideas, isCompare ? "compare" : "single", {
      useMock,
      intensityMode: mode as "war_room" | "quick",
    });

    // 3. Persist Simulation result linked to User and Idea(s)
    // For now, we link to the first idea as the "primary" one, 
    // but the result JSON contains both.
    const { data, error } = await supabase
      .from("simulations")
      .insert({
        mode: isCompare ? "compare" : "single",
        user_id: user.id,
        idea_id: ideas[0].id,
        input_json: JSON.stringify({ ideas }),
        result_json: JSON.stringify(result),
      })
      .select()
      .single();

    if (error) {
      console.error("Supabase error:", error);
      throw new Error("Failed to save simulation");
    }

    return { success: true, redirectUrl: `/run/${data.id}` };
  } catch (error) {
    console.error("Simulation failed:", error);
    return { success: false, error: "Failed to run simulation" };
  }
}
