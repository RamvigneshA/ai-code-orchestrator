import { FILE_ORCHESTRATOR_PROMPT } from './prompts';
import { VFSState } from '../types/vfs';

export interface VFSAction {
  type: 'WRITE_FILE' | 'DELETE_FILE';
  path: string;
  content?: string;
}

export interface MultiFileOrchestrationResult {
  explanation: string;
  project_structure: string[];
  actions: VFSAction[];
  reasoning_details?: string;
  usage?: {
    total_tokens: number;
    completion_tokens: number;
    prompt_tokens: number;
    reasoning_tokens?: number;
  };
}

export async function orchestrateVFS(files: VFSState, instruction: string): Promise<MultiFileOrchestrationResult> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY is not configured');
  }

  // Format the current VFS for the AI
  const vfsSnapshot = Object.entries(files).map(([path, file]) => {
    return `File: ${path}\nContent:\n${file.content}\n---`;
  }).join('\n');

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "http://localhost:3000",
      "X-OpenRouter-Title": "AI Code Orchestrator",
    },
    body: JSON.stringify({
      "model": "openai/gpt-oss-120b:free",
      "messages": [
        {
          "role": "system",
          "content": FILE_ORCHESTRATOR_PROMPT
        },
        {
          "role": "user",
          "content": `Current Project State:\n${vfsSnapshot}\n\nUser Instruction: ${instruction}`
        }
      ],
      "include_reasoning": true,
      "response_format": { "type": "json_object" }
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `OpenRouter API error: ${response.status}`);
  }

  const data = await response.json();
  const choice = data.choices?.[0];
  
  if (!choice || !choice.message?.content) {
    throw new Error('No response from AI model');
  }

  let parsed;
  try {
    parsed = JSON.parse(choice.message.content);
  } catch (e) {
    console.error('Failed to parse AI response:', choice.message.content);
    throw new Error('AI returned invalid JSON');
  }

  return {
    ...parsed,
    reasoning_details: choice.message.reasoning || null,
    usage: data.usage
  };
}