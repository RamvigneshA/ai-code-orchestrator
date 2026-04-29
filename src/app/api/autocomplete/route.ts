import { NextResponse } from 'next/server';
import { z } from 'zod';

const AutocompleteSchema = z.object({
  prefix: z.string(),
});

export async function POST(req: Request) {
  try {
    const { prefix } = AutocompleteSchema.parse(await req.json());

    // Call OpenRouter with streaming enabled
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:3000",
      },
      body: JSON.stringify({
        model: "anthropic/claude-3-haiku",
        stream: true, // ENABLE STREAMING
        messages: [
          {
            role: "system",
            content: "You are a code completion engine. Continue the code. ONLY return the continuation. No markdown. No explanations."
          },
          {
            role: "user",
            content: prefix
          }
        ],
        max_tokens: 50,
        temperature: 0.2,
      }),
    });

    // Create a readable stream to forward the OpenRouter stream
    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader();
        if (!reader) {
          controller.close();
          return;
        }

        const decoder = new TextDecoder();
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split('\n').filter(line => line.trim() !== '');

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data === '[DONE]') continue;
                try {
                  const parsed = JSON.parse(data);
                  const content = parsed.choices?.[0]?.delta?.content;
                  if (content) {
                    controller.enqueue(content);
                  }
                } catch (e) {
                  // Ignore malformed JSON chunks
                }
              }
            }
          }
        } finally {
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });

  } catch (error) {
    return NextResponse.json({ suggestion: "" }, { status: 500 });
  }
}
