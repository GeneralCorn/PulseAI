import { streamText } from "ai";
import { SYSTEM_PROMPTS } from "@/lib/sim/prompts";
import { MODELS, keywords, DIRECTOR_MODELS } from "@/lib/keywords";
import { createClient } from "@/lib/supabase/server";

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { messages, type, context, persona, idea, simulationId, selectedModel } = await req.json();

    console.log("Chat API Request:", { type, context, persona, idea, simulationId });

    let model = MODELS.DIRECTOR;
    let systemPrompt = "";

    if (type === "director") {
      model = MODELS.DIRECTOR;
      systemPrompt = SYSTEM_PROMPTS.CHAT_DIRECTOR(context);
    } else if (type === "persona") {
      model = MODELS.SPAWNER;
      systemPrompt = SYSTEM_PROMPTS.CHAT_PERSONA(persona, idea);
    }

    console.log("Using model:", model);

    // Load chat history from database if simulationId is provided
    let historicalMessages: any[] = [];
    if (type === "director" && simulationId) {
      try {
        const supabase = await createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          const { data: history } = await supabase
            .from("director_history")
            .select("role, content")
            .eq("simulation_id", simulationId)
            .eq("user_id", user.id)
            .order("created_at", { ascending: true });

          if (history && history.length > 0) {
            historicalMessages = history.map((h: any) => ({
              role: h.role,
              content: h.content,
            }));
            console.log("Loaded", history.length, "historical messages");
          }
        }
      } catch (error) {
        console.error("Failed to load chat history:", error);
      }
    }

    // Combine historical messages with new messages
    const allMessages = [...historicalMessages, ...messages];

    // Determine which model(s) to try
    const modelsToTry = selectedModel === "auto"
      ? [DIRECTOR_MODELS.GPT_5, DIRECTOR_MODELS.GPT_4O, DIRECTOR_MODELS.GPT_5_2]
      : [selectedModel || model];

    console.log("Models to try:", modelsToTry);

    let result;
    let lastError;

    // Try models in order until one succeeds
    for (const modelToUse of modelsToTry) {
      try {
        console.log(`Attempting with model: ${modelToUse}`);

        result = await streamText({
          model: keywords.chat(modelToUse),
          system: systemPrompt,
          messages: allMessages,
          maxTokens: 128,
          async onFinish({ text }) {
        // Store messages to database after stream completes
        if (type === "director" && simulationId && text) {
          try {
            const supabase = await createClient();
            const {
              data: { user },
            } = await supabase.auth.getUser();

            if (user) {
              const userMessage = messages[messages.length - 1];

              // Store user message
              await supabase.from("director_history").insert({
                simulation_id: simulationId,
                user_id: user.id,
                role: "user",
                content: userMessage.content,
              });

              // Store assistant response
              await supabase.from("director_history").insert({
                simulation_id: simulationId,
                user_id: user.id,
                role: "assistant",
                content: text,
              });

              console.log("Stored messages to database");
            }
          } catch (error) {
            console.error("Failed to store messages:", error);
          }
        }
      },
        });

        // If we got here, the model succeeded - break out of the loop
        console.log(`Successfully used model: ${modelToUse}`);
        break;
      } catch (error) {
        lastError = error;
        console.error(`Failed with model ${modelToUse}:`, error);

        // If this was the last model to try, throw the error
        if (modelToUse === modelsToTry[modelsToTry.length - 1]) {
          throw error;
        }

        // Otherwise, continue to the next model
        console.log("Trying next model...");
      }
    }

    if (!result) {
      throw lastError || new Error("No models available");
    }

    return result.toTextStreamResponse();
  } catch (error) {
    console.error("Chat API Error:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
}
