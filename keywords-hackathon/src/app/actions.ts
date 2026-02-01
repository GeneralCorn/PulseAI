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
    // 1. Create Idea(s) in DB (or use temp if DB fails)
    const ideas: Idea[] = [];
    let dbEnabled = true;

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
      console.warn("Failed to create idea A in DB (running in demo mode):", ideaAError);
      dbEnabled = false;
      ideas.push({
        id: "temp-idea-a",
        title,
        description,
      });
      // Fallback: If DB insert fails, we treat it as success for demo purposes
      // The user will see the simulation result but it won't be saved
    } else {
      ideas.push({
        id: ideaAData.id,
        title: ideaAData.title,
        description: ideaAData.description,
      });
    }

    // Create Idea B if in compare mode
    if (isCompare) {
      const titleB = formData.get("title_b") as string;
      const descriptionB = formData.get("description_b") as string;

      let ideaB: Idea | null = null;

      if (dbEnabled) {
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
          console.warn("Failed to create idea B in DB:", ideaBError);
          // If A succeeded but B failed, we should probably fail or downgrade to temp?
          // Let's downgrade entire run to temp to be safe.
          dbEnabled = false;
          ideaB = {
             id: "temp-idea-b",
             title: titleB,
             description: descriptionB,
          };
        } else {
           ideaB = {
            id: ideaBData.id,
            title: ideaBData.title,
            description: ideaBData.description,
           };
        }
      } else {
         ideaB = {
           id: "temp-idea-b",
           title: titleB,
           description: descriptionB,
         };
      }
      
      if (ideaB) ideas.push(ideaB);
    }

    // 2. Run Simulation
    console.log(`[Action] Starting simulation in ${mode} mode...`);
    const startTime = Date.now();
    
    const result = await runSimulation(ideas, isCompare ? "compare" : "single", {
      useMock,
      intensityMode: mode as "war_room" | "quick",
    });
    
    const duration = Date.now() - startTime;
    console.log(`[Action] Simulation completed in ${duration}ms`);

    // 2.5. Update idea(s) with credit usage
    if (dbEnabled && result.creditUsage) {
      const creditPerIdea = result.creditUsage / ideas.length; // Split evenly if comparing

      for (const idea of ideas) {
        // Fetch current credit usage
        const { data: currentIdea } = await supabase
          .from("ideas")
          .select("credit_usage")
          .eq("id", idea.id)
          .single();

        const newCreditUsage = (currentIdea?.credit_usage || 0) + creditPerIdea;

        // Update with new total
        const { error: updateError } = await supabase
          .from("ideas")
          .update({ credit_usage: newCreditUsage })
          .eq("id", idea.id);

        if (updateError) {
          console.warn(`Failed to update credit usage for idea ${idea.id}:`, updateError);
        } else {
          console.log(`[Action] Updated idea ${idea.id} credit usage: $${newCreditUsage.toFixed(6)}`);
        }
      }
    }

    // 3. Persist Simulation result linked to User and Idea(s)
    if (dbEnabled) {
        const { data, error } = await supabase
        .from("simulations")
        .insert({
            mode: isCompare ? "compare" : "single",
            user_id: user.id,
            idea_id: ideas[0].id, // Link to primary idea
            input_json: JSON.stringify({ ideas }),
            result_json: JSON.stringify(result),
        })
        .select()
        .single();

        if (error) {
            console.error("Supabase error saving simulation:", error);
            // Fallback to returning result directly
            return { success: true, result };
        }

        return { success: true, redirectUrl: `/run/${data.id}` };
    } else {
        // Return result directly for client-side rendering
        return { success: true, result };
    }

  } catch (error) {
    console.error("Simulation failed:", error);
    return { success: false, error: "Failed to run simulation. Please check server logs." };
  }
}
