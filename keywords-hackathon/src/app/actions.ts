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
  const sampleCount = parseInt(formData.get("sample_count") as string) || 10;

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
          // If A succeeded but B failed, delete A to prevent orphaned records
          const ideaAId = ideas[0]?.id;
          if (ideaAId && !ideaAId.startsWith("temp-")) {
            console.warn(`Deleting orphaned idea A (${ideaAId}) due to idea B failure`);
            await supabase.from("ideas").delete().eq("id", ideaAId);
            // Update ideas[0] to be a temp idea
            ideas[0] = {
              id: "temp-idea-a",
              title: ideas[0].title,
              description: ideas[0].description,
            };
          }
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
      intensityMode: mode as "war_room" | "quick",
      personaCount: sampleCount,
    });
    
    const duration = Date.now() - startTime;
    console.log(`[Action] Simulation completed in ${duration}ms`);
    console.log(`[Action] Credit usage from simulation: $${result.creditUsage?.toFixed(6) || '0.000000'}`);

    // 2.5. Update idea(s) with credit usage
    if (dbEnabled && result.creditUsage) {
      const creditPerIdea = result.creditUsage / ideas.length; // Split evenly if comparing
      console.log(`[Action] Updating ${ideas.length} idea(s) with $${creditPerIdea.toFixed(6)} each`);

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
    } else {
      console.warn(`[Action] Skipping credit usage update - dbEnabled: ${dbEnabled}, creditUsage: ${result.creditUsage}`);
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

export async function saveSimulationVersion(
  simulationId: string,
  updatedResult: any
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  try {
    // Get the current simulation
    const { data: currentSim, error: fetchError } = await supabase
      .from("simulations")
      .select("*")
      .eq("id", simulationId)
      .single();

    if (fetchError || !currentSim) {
      return { success: false, error: "Simulation not found" };
    }

    // Determine the parent_simulation_id
    const parentId = currentSim.parent_simulation_id || currentSim.id;

    // Get the highest version number for this simulation chain
    const { data: versions } = await supabase
      .from("simulations")
      .select("version")
      .or(`id.eq.${parentId},parent_simulation_id.eq.${parentId}`)
      .order("version", { ascending: false })
      .limit(1);

    const nextVersion = (versions?.[0]?.version || 1) + 1;

    // Create new version
    const { data: newVersion, error: insertError } = await supabase
      .from("simulations")
      .insert({
        mode: currentSim.mode,
        user_id: user.id,
        idea_id: currentSim.idea_id,
        input_json: currentSim.input_json,
        result_json: JSON.stringify(updatedResult),
        version: nextVersion,
        parent_simulation_id: parentId,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Failed to save simulation version:", insertError);
      return { success: false, error: "Failed to save version" };
    }

    return { success: true, versionId: newVersion.id, version: nextVersion };
  } catch (error) {
    console.error("Error saving simulation version:", error);
    return { success: false, error: "Failed to save version" };
  }
}
