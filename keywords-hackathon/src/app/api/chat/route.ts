import { createClient } from "@/lib/supabase/server";
import OpenAI from "openai";

export const maxDuration = 30;

// Initialize OpenAI client for Keywords AI
const openai = new OpenAI({
  baseURL: process.env.KEYWORDSAI_BASE_URL ?? "https://api.keywordsai.co/api",
  apiKey: process.env.KEYWORDSAI_API_KEY ?? process.env.NEXT_PUBLIC_KEYWORDS_AI_KEY ?? "",
});

// Model constants
const MODELS = {
  DIRECTOR: "gpt-4o",
  PERSONA: "gpt-4o-mini",
};

// Generate system prompt for persona chat
function getPersonaSystemPrompt(persona: {
  name: string;
  occupation?: string;
  profile: {
    one_liner: string;
    pain_points: string[];
    alternatives: string[];
    communication_style: {
      tone: string;
      verbosity: string;
    };
  };
}, idea: { title: string; description: string }, context?: string): string {
  return `You are ${persona.name}, a ${persona.occupation || "professional"}.

ABOUT YOU:
${persona.profile.one_liner}

YOUR PAIN POINTS:
${persona.profile.pain_points.map((p) => `- ${p}`).join("\n")}

YOUR COMMUNICATION STYLE:
- Tone: ${persona.profile.communication_style.tone}
- Verbosity: ${persona.profile.communication_style.verbosity}

CONTEXT:
You are discussing the idea "${idea.title}": ${idea.description}
${context ? `\nAdditional context: ${context}` : ""}

INSTRUCTIONS:
- Stay in character as ${persona.name}
- Respond based on your profile, pain points, and communication style
- Be authentic to your persona's perspective
- Consider how this idea affects your specific situation
- If asked about your opinion, reference your pain points and alternatives you've considered`;
}

// Generate system prompt for director chat
function getDirectorSystemPrompt(context: string): string {
  return `You are the Director of a stakeholder simulation.

CONTEXT:
${context}

Your role is to:
1. Provide strategic analysis of the simulation results
2. Answer questions about risks, recommendations, and the strategic plan
3. Help the user understand stakeholder perspectives
4. Offer actionable insights based on the simulation data

Be professional, analytical, and provide concrete recommendations when asked.`;
}

export async function POST(req: Request) {
  try {
    const { messages, type, context, persona, idea, simulationId, selectedModel } = await req.json();

    console.log("Chat API Request:", { type, hasPersona: !!persona, hasIdea: !!idea, simulationId });

    let model = type === "director" ? MODELS.DIRECTOR : MODELS.PERSONA;
    let systemPrompt = "";

    if (type === "director") {
      systemPrompt = getDirectorSystemPrompt(context || "No context provided");
    } else if (type === "persona" && persona && idea) {
      systemPrompt = getPersonaSystemPrompt(persona, idea, context);
    } else {
      return new Response(JSON.stringify({ error: "Invalid request: missing persona or idea" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Load chat history from database if simulationId is provided (director only)
    let historicalMessages: Array<{ role: string; content: string }> = [];
    if (type === "director" && simulationId) {
      try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
          const { data: history } = await supabase
            .from("director_history")
            .select("role, content")
            .eq("simulation_id", simulationId)
            .eq("user_id", user.id)
            .order("created_at", { ascending: true });

          if (history && history.length > 0) {
            historicalMessages = history.map((h) => ({
              role: h.role as string,
              content: h.content as string,
            }));
            console.log("Loaded", history.length, "historical messages");
          }
        }
      } catch (error) {
        console.error("Failed to load chat history:", error);
      }
    }

    // Combine historical messages with new messages
    const allMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: "system", content: systemPrompt },
      ...historicalMessages.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
      ...messages.map((m: { role: string; content: string }) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
    ];

    // Use selected model or default
    const modelToUse = selectedModel && selectedModel !== "auto" ? selectedModel : model;
    console.log("Using model:", modelToUse);

    // Stream the response using OpenAI SDK
    const response = await openai.chat.completions.create({
      model: modelToUse,
      messages: allMessages,
      max_tokens: 400,
      stream: true,
    });

    // Create a readable stream from the OpenAI response
    const encoder = new TextEncoder();
    let fullResponse = "";

    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of response) {
            const content = chunk.choices[0]?.delta?.content || "";
            if (content) {
              fullResponse += content;
              controller.enqueue(encoder.encode(content));
            }
          }

          // Store messages to database after stream completes (director only)
          if (type === "director" && simulationId && fullResponse) {
            try {
              const supabase = await createClient();
              const { data: { user } } = await supabase.auth.getUser();

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
                  content: fullResponse,
                });

                console.log("Stored messages to database");
              }
            } catch (error) {
              console.error("Failed to store messages:", error);
            }
          }

          controller.close();
        } catch (error) {
          console.error("Stream error:", error);
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    console.error("Chat API Error:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
