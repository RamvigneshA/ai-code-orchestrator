import { NextResponse } from 'next/server';
import { z } from 'zod';
import { orchestrateCode } from '@/lib/ai/agent';

// Schema for input validation
const OrchestrateSchema = z.object({
  code: z.string().min(1, "Code is required"),
  instruction: z.string().min(1, "Instruction is required"),
});

export async function POST(req: Request) {
  try {
    // 1. Parse and validate input
    const body = await req.json();
    const validation = OrchestrateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid request data", details: validation.error.format() },
        { status: 400 }
      );
    }

    const { code, instruction } = validation.data;

    // 2. Gather Project Context (Imports, etc.)
    const { gatherContext, formatContext } = await import("@/lib/ai/context");
    const contextFiles = await gatherContext(code);
    const contextString = formatContext(contextFiles);

    // 3. Call the orchestration service with enriched instructions
    const result = await orchestrateCode(code, instruction + (contextString ? `\n\n${contextString}` : ""));

    // 3. Return structured result
    return NextResponse.json(result);

  } catch (error: any) {
    console.error("[ORCHESTRATE_ERROR]:", error);

    // Specific error handling for different scenarios
    if (error.message?.includes('OPENROUTER_API_KEY')) {
      return NextResponse.json(
        { error: "AI Service configuration error" },
        { status: 500 }
      );
    }

    if (error.message?.includes('invalid JSON') || error.message?.includes('No response')) {
      return NextResponse.json(
        { error: "AI failed to generate a valid response. Please try again." },
        { status: 502 }
      );
    }

    // Default error response
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
