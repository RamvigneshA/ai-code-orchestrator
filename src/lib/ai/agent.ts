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

export async function orchestrateVFS(
  files: VFSState, 
  instruction: string, 
  fileList?: string[], 
  history: { role: string, content: string }[] = []
): Promise<MultiFileOrchestrationResult> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY is not configured');
  }

  // Format the current VFS for the AI
  const vfsSnapshot = Object.entries(files).map(([path, file]) => {
    return `File: ${path}\nContent:\n${file.content}\n---`;
  }).join('\n');

  // If a fileList is provided (when using @mentions), inform the AI about other files
  const projectContext = fileList && fileList.length > 0 
    ? `Available files in project:\n${fileList.join('\n')}\n\nFiles provided for full context:\n${vfsSnapshot}`
    : `Current Project State:\n${vfsSnapshot}`;

  // Limit history to last 10 turns to save tokens and prevent context overflow
  const formattedHistory = history
    .filter(h => h.role === 'user' || h.role === 'assistant')
    .slice(-10)
    .map(h => ({ role: h.role, content: h.content }));

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
        ...formattedHistory,
        {
          "role": "user",
          "content": `${projectContext}\n\nUser Instruction: ${instruction}`
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

  const content = choice.message.content.trim();
  let parsed;
  
  try {
    // Attempt standard parse first
    parsed = JSON.parse(content);
  } catch (e) {
    // Try to clean markdown wrappers and retry
    try {
      const cleaned = content
        .replace(/^```json\s*/, '')
        .replace(/^```\s*/, '')
        .replace(/\s*```$/, '');
      parsed = JSON.parse(cleaned);
    } catch (innerError) {
      console.error('Failed to parse AI response:', content);
      
      // One last desperate attempt: if it looks like it was cut off
      if (content.startsWith('{') && !content.endsWith('}')) {
        try {
          const repaired = content + '"]}'; // Try to close potential actions array
          parsed = JSON.parse(repaired);
        } catch (finalError) {
          throw new Error('AI returned invalid JSON');
        }
      } else {
        throw new Error('AI returned invalid JSON');
      }
    }
  }

  return {
    ...parsed,
    reasoning_details: choice.message.reasoning || null,
    usage: data.usage
  };
}