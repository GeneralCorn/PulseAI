
import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

async function main() {
  const apiKey = process.env.NEXT_PUBLIC_KEYWORDS_AI_KEY;
  if (!apiKey) {
    console.error("No API key found!");
    process.exit(1);
  }

  console.log("Testing Keywords AI with key length:", apiKey.length);

  const keywords = createOpenAI({
    baseURL: "https://api.keywordsai.co/api",
    apiKey: apiKey,
  });

  try {
    console.log("Sending request...");
    const result = await generateText({
      model: keywords("gpt-5-mini"),
      prompt: "Say hello",
    });
    console.log("Success:", result.text);
  } catch (error) {
    console.error("Error:", error);
  }
}

main();
