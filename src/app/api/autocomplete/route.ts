import { NextResponse } from 'next/server';
import { z } from 'zod';

const AutocompleteSchema = z.object({
  prefix: z.string(), // Code before the cursor
});

export async function POST(req: Request) {
  try {
    const { prefix } = AutocompleteSchema.parse(await req.json());

    // Call OpenRouter with a specific "Completion" prompt
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:3000",
      },
      body: JSON.stringify({
        model: "anthropic/claude-3-haiku", // Haiku is perfect for fast completions
        messages: [
          {
            role: "system",
            content: "You are a code completion engine. Your task is to provide the continuation of the code provided in the user's prompt. ONLY return the continuation text. Do not include markdown code blocks, explanations, or formatting. Your output will be directly inserted at the cursor position."
          },
          {
            role: "user",
            content: `Complete this code:\n\n${prefix}`
          }
        ],
        max_tokens: 50,
        temperature: 0.2,
      }),
    });

    const data = await response.json();
    const suggestion = data.choices?.[0]?.message?.content || "";

    return NextResponse.json({ suggestion });

  } catch (error) {
    return NextResponse.json({ suggestion: "" }, { status: 500 });
  }
}
