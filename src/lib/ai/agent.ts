import { ORCHESTRATOR_SYSTEM_PROMPT } from './prompts';

export interface OrchestrationResult {
  content: string;
  path: string;
  explanation: string;
  reasoning_details?: string;
  usage?: {
    total_tokens: number;
    completion_tokens: number;
    prompt_tokens: number;
    reasoning_tokens?: number;
    completion_tokens_details?: {
      reasoning_tokens?: number;
    };
  };
}

export async function orchestrateCode(code: string, instruction: string): Promise<OrchestrationResult> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY is not configured');
  }

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "http://localhost:3000", // Optional, for rankings
      "X-OpenRouter-Title": "AI Code Orchestrator", // Optional, for rankings
    },
    body: JSON.stringify({
      "model": "openai/gpt-oss-120b:free",
      "messages": [
        {
          "role": "system",
          "content": ORCHESTRATOR_SYSTEM_PROMPT
        },
        {
          "role": "user",
          "content": `Current Code:\n${code}\n\nInstruction: ${instruction}`
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
  console.log('OpenRouter API response:', data);
  const choice = data.choices?.[0];
  console.log('Choice:', choice);
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