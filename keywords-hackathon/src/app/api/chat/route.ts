import { SYSTEM_PROMPTS } from "@/lib/sim/prompts";
import { MODELS } from "@/lib/keywords";

const KEYWORDS_API_KEY = process.env.NEXT_PUBLIC_KEYWORDS_AI_KEY;

export async function POST(req: Request) {
  try {
    const { messages, type, context, persona, idea } = await req.json();

    console.log("Chat API Request:", { type, context, persona, idea });

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
    console.log("System prompt:", systemPrompt);

    // Add system message to the beginning of messages
    const enhancedMessages = [
      { role: "system", content: systemPrompt },
      ...messages,
    ];

    // Call Keywords AI API directly
    const response = await fetch(
      "https://api.keywordsai.co/api/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${KEYWORDS_API_KEY}`,
        },
        body: JSON.stringify({
          model: model,
          messages: enhancedMessages,
          stream: true,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Keywords AI API error:", errorText);
      throw new Error(`Keywords AI API error: ${response.status} ${errorText}`);
    }

    // Create a TransformStream to parse the OpenAI-compatible stream and extract text
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const stream = new ReadableStream({
      async start(controller) {
        if (!response.body) {
          controller.close();
          return;
        }

        const reader = response.body.getReader();
        let buffer = "";

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";

            for (const line of lines) {
              if (line.trim() === "" || line.trim() === "data: [DONE]")
                continue;

              if (line.startsWith("data: ")) {
                try {
                  const json = JSON.parse(line.slice(6));
                  const content = json.choices[0]?.delta?.content || "";
                  if (content) {
                    controller.enqueue(encoder.encode(content));
                  }
                } catch (e) {
                  console.error("Error parsing stream line:", line, e);
                }
              }
            }
          }
        } catch (error) {
          console.error("Stream reading error:", error);
          controller.error(error);
        } finally {
          controller.close();
        }
      },
    });

    // Return the streaming response
    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
      },
    });
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
