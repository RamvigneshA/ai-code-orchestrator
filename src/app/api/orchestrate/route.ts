import { NextResponse } from 'next/server';
import { orchestrateVFS } from '@/lib/ai/agent';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { files, instruction } = body;

    if (!files || !instruction) {
      return NextResponse.json({ error: "Missing files or instruction" }, { status: 400 });
    }

    // 2. Call the orchestration service with full VFS
    const result = await orchestrateVFS(files, instruction);

    // 3. Return structured result
    return NextResponse.json(result);

  } catch (error: any) {
    console.error("[ORCHESTRATE_ERROR]:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
